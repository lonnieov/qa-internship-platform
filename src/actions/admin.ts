"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { passwordPolicyError } from "@/lib/admin-auth";
import { expireAttemptIfNeeded } from "@/lib/assessment";
import { parseHeaderLines, parseQueryString } from "@/lib/api-sandbox";
import { getManageableTrackIds, requireAdmin, requireAdminAccess } from "@/lib/auth";
import { getRequestLocale, localizedPath } from "@/lib/locale";
import { getOpenQuizConfig } from "@/lib/open-quiz";
import { ALL_TRACKS_VALUE, normalizeLegacyTrack } from "@/lib/question-classification";
import { isQuestionTypeAllowedForTrack } from "@/lib/question-type-policy";
import {
  encryptInviteCode,
  generateInviteCode,
  hashInviteCode,
  maskInviteCode,
} from "@/lib/security";
import { ensureTracks, nextTrackOrder, uniqueTrackSlug } from "@/lib/tracks";
import { ensureDefaultWave, nextWaveOrder, uniqueWaveSlug } from "@/lib/waves";
import { nextGradeOrder, uniqueGradeSlug } from "@/lib/grades";
import { ensureDefaultVersion, nextVersionName } from "@/lib/question-versions";
import {
  addMissionTranslation,
  readAutotestSandboxConfig,
  readManualQaSandboxConfig,
  readSqlSandboxConfig,
} from "@/lib/question-config-form";

const defaultInvitationExpiryDays = 14;

// Upper bounds for free-text fields persisted to the database. Prevents a
// malicious or buggy client from writing unbounded strings into text columns.
const MAX_NAME_LENGTH = 200;
const MAX_TEXT_LENGTH = 5000;

function clampText(value: FormDataEntryValue | null, maxLength: number) {
  return String(value ?? "")
    .trim()
    .slice(0, maxLength);
}

export type InvitationState = {
  ok: boolean;
  message: string;
  inviteCode?: string;
  invitation?: {
    id: string;
    candidateName: string;
    inviteCodeMask: string;
    inviteCodeCopyValue?: string;
    status: string;
    createdAt: string;
    acceptedAt: string;
    canRevoke: boolean;
  };
};

export type ImportQuestionsState = {
  ok: boolean;
  message: string;
  errors?: string[];
  importedCount?: number;
};

const MAX_IMPORT_QUESTIONS = 200;
const MAX_IMPORT_OPTIONS = 8;
const MAX_IMPORT_FILE_BYTES = 2 * 1024 * 1024;

type ParsedImportOption = {
  text: string;
  textUz: string;
  isCorrect: boolean;
};

type ParsedImportQuestion =
  | {
      mode: "CHOICE";
      text: string;
      textUz: string;
      explanation: string;
      options: ParsedImportOption[];
    }
  | {
      mode: "OPEN_TEXT";
      text: string;
      textUz: string;
      explanation: string;
      expectedAnswer: string;
      answerLabel: string;
      placeholder: string;
    };

function validateImportPayload(
  raw: unknown,
):
  | { ok: true; questions: ParsedImportQuestion[] }
  | { ok: false; errors: string[] } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      ok: false,
      errors: ['Корневой элемент JSON должен быть объектом с полем "questions".'],
    };
  }

  const questionsRaw = (raw as Record<string, unknown>).questions;
  if (!Array.isArray(questionsRaw) || questionsRaw.length === 0) {
    return {
      ok: false,
      errors: ['Поле "questions" должно быть непустым массивом.'],
    };
  }
  if (questionsRaw.length > MAX_IMPORT_QUESTIONS) {
    return {
      ok: false,
      errors: [`Слишком много вопросов за один импорт (максимум ${MAX_IMPORT_QUESTIONS}).`],
    };
  }

  const errors: string[] = [];
  const parsed: ParsedImportQuestion[] = [];

  questionsRaw.forEach((rawItem, index) => {
    const n = index + 1;
    if (!rawItem || typeof rawItem !== "object" || Array.isArray(rawItem)) {
      errors.push(`Вопрос ${n}: должен быть объектом.`);
      return;
    }
    const item = rawItem as Record<string, unknown>;
    const mode = item.mode;
    if (mode !== "CHOICE" && mode !== "OPEN_TEXT") {
      errors.push(`Вопрос ${n}: поле "mode" должно быть "CHOICE" или "OPEN_TEXT".`);
      return;
    }

    const text = typeof item.text === "string" ? item.text.trim() : "";
    const textUz = typeof item.textUz === "string" ? item.textUz.trim() : "";
    const explanation =
      typeof item.explanation === "string" ? item.explanation.trim() : "";

    if (!text) errors.push(`Вопрос ${n}: отсутствует "text" (текст на русском).`);
    if (!textUz) errors.push(`Вопрос ${n}: отсутствует "textUz" (текст на узбекском).`);

    if (mode === "CHOICE") {
      const optionsRaw = Array.isArray(item.options) ? item.options : null;
      if (!optionsRaw || optionsRaw.length < 2) {
        errors.push(`Вопрос ${n}: нужно минимум 2 варианта ответа в "options".`);
        return;
      }
      if (optionsRaw.length > MAX_IMPORT_OPTIONS) {
        errors.push(
          `Вопрос ${n}: слишком много вариантов (максимум ${MAX_IMPORT_OPTIONS}).`,
        );
        return;
      }

      let correctCount = 0;
      const options: ParsedImportOption[] = optionsRaw.map((rawOption, optIndex) => {
        const option =
          rawOption && typeof rawOption === "object"
            ? (rawOption as Record<string, unknown>)
            : {};
        const optText = typeof option.text === "string" ? option.text.trim() : "";
        const optTextUz =
          typeof option.textUz === "string" ? option.textUz.trim() : "";
        const isCorrect = option.isCorrect === true;

        if (!optText) {
          errors.push(`Вопрос ${n}, вариант ${optIndex + 1}: отсутствует "text".`);
        }
        if (!optTextUz) {
          errors.push(`Вопрос ${n}, вариант ${optIndex + 1}: отсутствует "textUz".`);
        }
        if (isCorrect) correctCount += 1;

        return { text: optText, textUz: optTextUz, isCorrect };
      });

      if (correctCount !== 1) {
        errors.push(
          `Вопрос ${n}: должен быть ровно один вариант с "isCorrect": true (найдено ${correctCount}).`,
        );
      }

      if (!text || !textUz) return;
      parsed.push({ mode: "CHOICE", text, textUz, explanation, options });
    } else {
      const expectedAnswer =
        typeof item.expectedAnswer === "string" ? item.expectedAnswer.trim() : "";
      const answerLabel =
        typeof item.answerLabel === "string" ? item.answerLabel.trim() : "";
      const placeholder =
        typeof item.placeholder === "string" ? item.placeholder.trim() : "";

      if (!text || !textUz) return;
      parsed.push({
        mode: "OPEN_TEXT",
        text,
        textUz,
        explanation,
        expectedAnswer,
        answerLabel,
        placeholder,
      });
    }
  });

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, questions: parsed };
}

function getInvitationExpiryDays() {
  const value = Number(process.env.INTERN_INVITATION_EXPIRES_IN_DAYS);

  if (!Number.isFinite(value)) {
    return defaultInvitationExpiryDays;
  }

  return Math.max(1, Math.round(value));
}

function getInvitationExpiresAt() {
  return new Date(Date.now() + getInvitationExpiryDays() * 24 * 60 * 60 * 1000);
}

function formatInvitationDateTime(value: Date | null | undefined) {
  if (!value) return "—";

  return value.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function canManageTrack(
  profile: { id: string; role: string },
  trackId: string | null | undefined,
  isGlobal = false,
) {
  const manageableTrackIds = await getManageableTrackIds(profile);
  // A global ("Все треки") question is only manageable by an unrestricted
  // ADMIN — getManageableTrackIds returns null for them, an array of ids for
  // a TRACK_MASTER — never treat trackId: null here as "no permission".
  if (isGlobal) return manageableTrackIds === null;
  if (!trackId) return false;
  return !manageableTrackIds || manageableTrackIds.includes(trackId);
}

async function ensureCanManageTrack(
  profile: { id: string; role: string },
  trackId: string | null | undefined,
  locale?: string,
  isGlobal = false,
) {
  if (!(await canManageTrack(profile, trackId, isGlobal))) {
    redirect(localizedPath("/admin", await getRequestLocale(locale)));
  }
}

async function resolveInvitationScope(formData?: FormData) {
  const waveId = String(formData?.get("waveId") ?? "");
  const selectedWave = waveId
    ? await prisma.wave.findUnique({ where: { id: waveId } })
    : null;

  let trackId: string | null;
  let resolvedWaveId: string | null;

  if (selectedWave) {
    trackId = selectedWave.trackId;
    resolvedWaveId = selectedWave.id;
  } else {
    const tracks = await ensureTracks();
    const track = tracks.find((item) => item.slug === "qa") ?? tracks[0] ?? null;
    const wave = track ? await ensureDefaultWave(track.id) : null;
    trackId = track?.id ?? null;
    resolvedWaveId = wave?.id ?? null;
  }

  const gradeVersion = await resolveTrackGradeVersion(
    formData ?? new FormData(),
    trackId,
  );

  return {
    trackId,
    waveId: resolvedWaveId,
    gradeId: gradeVersion.gradeId,
  };
}

async function resolveQuestionTrack(formData: FormData) {
  const trackId = String(formData.get("trackId") ?? "");

  if (trackId === ALL_TRACKS_VALUE) {
    return {
      trackId: null,
      trackSlug: "all",
      trackName: "Все треки",
      isGlobal: true,
    };
  }

  const selectedTrack = trackId
    ? await prisma.track.findUnique({ where: { id: trackId } })
    : null;

  if (selectedTrack) {
    return {
      trackId: selectedTrack.id,
      trackSlug: selectedTrack.slug,
      trackName: selectedTrack.name,
      isGlobal: false,
    };
  }

  const tracks = await ensureTracks();
  const fallbackTrack =
    tracks.find((track) => track.slug === "qa") ?? tracks[0] ?? null;

  return {
    trackId: fallbackTrack?.id ?? null,
    trackSlug: fallbackTrack?.slug ?? "qa",
    trackName:
      fallbackTrack?.name ?? normalizeLegacyTrack(String(formData.get("track") ?? "")),
    isGlobal: false,
  };
}

async function resolveTrackGradeVersion(
  formData: FormData,
  trackId: string | null,
) {
  if (!trackId) return { gradeId: null, versionId: null };

  const requestedGradeId = String(formData.get("gradeId") ?? "");
  const requestedGrade = requestedGradeId
    ? await prisma.grade.findFirst({ where: { id: requestedGradeId, trackId } })
    : null;
  const grade =
    requestedGrade ??
    (await prisma.grade.findFirst({
      where: { trackId },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    }));

  if (!grade) return { gradeId: null, versionId: null };

  const requestedVersionId = String(formData.get("versionId") ?? "");
  const requestedVersion = requestedVersionId
    ? await prisma.questionVersion.findFirst({
        where: { id: requestedVersionId, gradeId: grade.id },
      })
    : null;
  const version =
    requestedVersion ??
    (await prisma.questionVersion.findFirst({
      where: { gradeId: grade.id, isActive: true },
    })) ??
    (await prisma.questionVersion.findFirst({
      where: { gradeId: grade.id },
      orderBy: { createdAt: "asc" },
    }));

  return { gradeId: grade.id, versionId: version?.id ?? null };
}

function questionRedirectUrl(
  questionType: string,
  trackSlug: string,
  created = false,
  locale: string,
) {
  const params = new URLSearchParams({
    type:
      questionType === "API_SANDBOX" ||
      questionType === "DEVTOOLS_SANDBOX" ||
      questionType === "MANUAL_QA_SANDBOX" ||
      questionType === "AUTOTEST_SANDBOX" ||
      questionType === "SQL_SANDBOX"
        ? questionType
        : "QUIZ",
  });

  if (trackSlug && trackSlug !== "all") {
    params.set("track", trackSlug);
  }

  if (created) {
    params.set("created", "1");
  }

  return localizedPath(`/admin/questions?${params.toString()}`, locale);
}

export async function createInvitationAction(
  _prevState: InvitationState,
  formData: FormData,
): Promise<InvitationState> {
  const admin = await requireAdminAccess();
  const candidateName = clampText(formData.get("candidateName"), MAX_NAME_LENGTH);

  if (!candidateName) {
    return { ok: false, message: "Укажите имя и фамилию кандидата." };
  }

  const inviteCode = generateInviteCode();
  const inviteCodeMask = maskInviteCode(inviteCode);
  const inviteCodeEncrypted = encryptInviteCode(inviteCode);
  const expiresAt = getInvitationExpiresAt();

  const scope = await resolveInvitationScope(formData);
  await ensureCanManageTrack(admin, scope.trackId);

  const invitation = await prisma.invitation.create({
    data: {
      candidateName,
      inviteCodeHash: hashInviteCode(inviteCode),
      inviteCodeMask,
      inviteCodeEncrypted,
      expiresAt,
      createdById: admin.id,
      trackId: scope.trackId,
      waveId: scope.waveId,
      gradeId: scope.gradeId,
    },
  });

  revalidatePath("/admin/interns");

  return {
    ok: true,
    message: "Токен создан. Он показывается только сейчас.",
    inviteCode,
    invitation: {
      id: invitation.id,
      candidateName: invitation.candidateName,
      inviteCodeMask: invitation.inviteCodeMask ?? "••••",
      inviteCodeCopyValue: inviteCode,
      status: invitation.status,
      createdAt: formatInvitationDateTime(invitation.createdAt),
      acceptedAt: formatInvitationDateTime(invitation.acceptedAt),
      canRevoke: invitation.status === "PENDING",
    },
  };
}

export async function revokeInvitationAction(formData: FormData) {
  const profile = await requireAdminAccess();
  const invitationId = String(formData.get("invitationId") ?? "");

  if (!invitationId) return;

  const invitation = await prisma.invitation.findUnique({
    where: { id: invitationId },
    select: { trackId: true },
  });
  await ensureCanManageTrack(profile, invitation?.trackId);

  await prisma.invitation.update({
    where: { id: invitationId },
    data: { status: "REVOKED" },
  });

  revalidatePath("/admin/interns");
}

export async function deleteInternCandidateAction(formData: FormData) {
  const locale = await getRequestLocale(formData.get("locale"));
  const profile = await requireAdminAccess({ locale });
  const internProfileId = String(formData.get("internProfileId") ?? "").trim();
  const invitationIds = Array.from(
    new Set(
      formData
        .getAll("invitationId")
        .map((value) => String(value).trim())
        .filter(Boolean),
    ),
  );

  if (!internProfileId && invitationIds.length === 0) return;

  const manageableTrackIds = await getManageableTrackIds(profile);
  const intern = internProfileId
    ? await prisma.internProfile.findUnique({
        where: { id: internProfileId },
        select: {
          id: true,
          invitationId: true,
          profileId: true,
          trackId: true,
        },
      })
    : null;

  if (internProfileId && !intern) return;
  if (
    manageableTrackIds &&
    intern &&
    (!intern.trackId || !manageableTrackIds.includes(intern.trackId))
  ) {
    return;
  }

  const deletionInvitationIds = new Set(invitationIds);
  if (intern?.invitationId) {
    deletionInvitationIds.add(intern.invitationId);
  }

  const invitations =
    deletionInvitationIds.size > 0
      ? await prisma.invitation.findMany({
          where: { id: { in: Array.from(deletionInvitationIds) } },
          select: { id: true, trackId: true },
        })
      : [];

  if (
    manageableTrackIds &&
    invitations.some(
      (invitation) =>
        !invitation.trackId || !manageableTrackIds.includes(invitation.trackId),
    )
  ) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    if (intern) {
      await tx.invitation.updateMany({
        where: { acceptedByProfileId: intern.profileId },
        data: { acceptedByProfileId: null },
      });
      await tx.profile.delete({ where: { id: intern.profileId } });
    }

    if (deletionInvitationIds.size > 0) {
      await tx.invitation.deleteMany({
        where: { id: { in: Array.from(deletionInvitationIds) } },
      });
    }
  });

  revalidatePath("/admin/interns");
  revalidatePath("/admin");
  redirect(localizedPath("/admin/interns?deleted=1", locale));
}

export async function updateSettingsAction(formData: FormData) {
  await requireAdmin();
  const totalTimeMinutes = Number(formData.get("totalTimeMinutes") ?? 30);

  await prisma.assessmentSettings.upsert({
    where: { id: "global" },
    update: {
      totalTimeMinutes: Math.min(
        Math.max(Math.round(totalTimeMinutes), 1),
        240,
      ),
    },
    create: {
      id: "global",
      totalTimeMinutes: Math.min(
        Math.max(Math.round(totalTimeMinutes), 1),
        240,
      ),
    },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
}

export async function createQuestionAction(formData: FormData) {
  const locale = await getRequestLocale(formData.get("locale"));
  const admin = await requireAdminAccess({ locale });
  const questionType = String(formData.get("questionType") ?? "QUIZ");
  const quizMode = String(formData.get("quizMode") ?? "CHOICE");
  const track = await resolveQuestionTrack(formData);
  await ensureCanManageTrack(admin, track.trackId, locale, track.isGlobal);
  if (!isQuestionTypeAllowedForTrack(questionType, track.trackSlug)) {
    redirect(questionRedirectUrl("QUIZ", track.trackSlug, false, locale));
  }
  const gradeVersion = await resolveTrackGradeVersion(
    formData,
    track.trackId,
  );

  const text = clampText(formData.get("text"), MAX_TEXT_LENGTH);
  const textUz = clampText(formData.get("textUz"), MAX_TEXT_LENGTH);
  const explanation = clampText(formData.get("explanation"), MAX_TEXT_LENGTH);

  const lastQuestion = await prisma.question.findFirst({
    orderBy: { order: "desc" },
  });

  if (questionType === "SQL_SANDBOX") {
    if (!text || !textUz) {
      return;
    }

    let apiConfig;
    try {
      apiConfig = addMissionTranslation(
        readSqlSandboxConfig(formData, text),
        textUz,
      );
    } catch {
      return;
    }

    await prisma.question.create({
      data: {
        type: "SQL_SANDBOX",
        text,
        textUz,
        track: track.trackName,
        trackId: track.trackId,
        isGlobal: track.isGlobal,
        gradeId: gradeVersion.gradeId,
        versionId: gradeVersion.versionId,
        explanation: explanation || null,
        order: (lastQuestion?.order ?? 0) + 1,
        createdById: admin.id,
        apiConfig,
      },
    });
  } else if (questionType === "MANUAL_QA_SANDBOX") {
    if (!text || !textUz) {
      return;
    }

    let apiConfig;
    try {
      apiConfig = addMissionTranslation(
        readManualQaSandboxConfig(formData, text),
        textUz,
      );
    } catch {
      return;
    }

    await prisma.question.create({
      data: {
        type: "MANUAL_QA_SANDBOX",
        text,
        textUz,
        track: track.trackName,
        trackId: track.trackId,
        isGlobal: track.isGlobal,
        gradeId: gradeVersion.gradeId,
        versionId: gradeVersion.versionId,
        explanation: explanation || null,
        order: (lastQuestion?.order ?? 0) + 1,
        createdById: admin.id,
        apiConfig,
      },
    });
  } else if (questionType === "AUTOTEST_SANDBOX") {
    if (!text || !textUz) {
      return;
    }

    let apiConfig;
    try {
      apiConfig = addMissionTranslation(
        readAutotestSandboxConfig(formData, text),
        textUz,
      );
    } catch {
      return;
    }

    await prisma.question.create({
      data: {
        type: "AUTOTEST_SANDBOX",
        text,
        textUz,
        track: track.trackName,
        trackId: track.trackId,
        isGlobal: track.isGlobal,
        gradeId: gradeVersion.gradeId,
        versionId: gradeVersion.versionId,
        explanation: explanation || null,
        order: (lastQuestion?.order ?? 0) + 1,
        createdById: admin.id,
        apiConfig,
      },
    });
  } else if (
    questionType === "API_SANDBOX" ||
    questionType === "DEVTOOLS_SANDBOX"
  ) {
    const method = String(formData.get("apiMethod") ?? "GET")
      .trim()
      .toUpperCase();
    const path = String(formData.get("apiPath") ?? "").trim();
    const query = String(formData.get("apiQuery") ?? "").trim();
    const headersText = String(formData.get("apiHeaders") ?? "").trim();
    const bodyText = String(formData.get("apiBody") ?? "").trim();
    const successStatus = Number(formData.get("apiSuccessStatus") ?? 200);
    const successBodyText = String(formData.get("apiSuccessBody") ?? "").trim();
    const answerPath = String(formData.get("apiAnswerPath") ?? "").trim();
    const expectedAnswer = String(
      formData.get("apiExpectedAnswer") ?? "",
    ).trim();

    if (!text || !textUz || !path) {
      return;
    }

    if (
      questionType === "DEVTOOLS_SANDBOX" &&
      (!successBodyText || !answerPath || !expectedAnswer)
    ) {
      return;
    }

    let apiConfig;

    try {
      if (questionType === "API_SANDBOX") {
        apiConfig = {
          mode: "MANUAL_REQUEST",
          method,
          path,
          query: parseQueryString(query),
          headers: parseHeaderLines(headersText),
          body: bodyText ? JSON.parse(bodyText) : undefined,
          successStatus: Number.isFinite(successStatus) ? successStatus : 200,
          successBody: successBodyText
            ? JSON.parse(successBodyText)
            : { ok: true },
        };
      } else {
        apiConfig = {
          mode: "DEVTOOLS_RESPONSE",
          method,
          path,
          query: parseQueryString(query),
          successHeaders: parseHeaderLines(headersText),
          body: bodyText ? JSON.parse(bodyText) : undefined,
          successStatus: Number.isFinite(successStatus) ? successStatus : 200,
          successBody: successBodyText
            ? JSON.parse(successBodyText)
            : { ok: true },
          buttonLabel: String(
            formData.get("apiButtonLabel") ?? "Отправить запрос",
          ).trim(),
          answerLabel: String(formData.get("apiAnswerLabel") ?? "").trim(),
          answerPath,
          expectedAnswer,
        };
      }
    } catch {
      return;
    }

    await prisma.question.create({
      data: {
        type: questionType,
        text,
        textUz,
        track: track.trackName,
        trackId: track.trackId,
        isGlobal: track.isGlobal,
        gradeId: gradeVersion.gradeId,
        versionId: gradeVersion.versionId,
        explanation: explanation || null,
        order: (lastQuestion?.order ?? 0) + 1,
        createdById: admin.id,
        apiConfig,
      },
    });
  } else {
    if (quizMode === "OPEN_TEXT") {
      const expectedAnswer = String(
        formData.get("openExpectedAnswer") ?? "",
      ).trim();
      const answerLabel = String(formData.get("openAnswerLabel") ?? "").trim();
      const placeholder = String(formData.get("openPlaceholder") ?? "").trim();

      if (!text || !textUz) {
        return;
      }

      await prisma.question.create({
        data: {
          type: "QUIZ",
          text,
          textUz,
          track: track.trackName,
          trackId: track.trackId,
          isGlobal: track.isGlobal,
          gradeId: gradeVersion.gradeId,
          versionId: gradeVersion.versionId,
          explanation: explanation || null,
          order: (lastQuestion?.order ?? 0) + 1,
          createdById: admin.id,
          apiConfig: {
            mode: "OPEN_TEXT",
            ...(expectedAnswer ? { expectedAnswer } : {}),
            ...(answerLabel ? { answerLabel } : {}),
            ...(placeholder ? { placeholder } : {}),
          },
        },
      });

      revalidatePath("/admin/questions");
      revalidatePath("/admin");
      redirect(questionRedirectUrl(questionType, track.trackSlug, true, locale));
    }

    const correctIndex = Number(formData.get("correctOption"));
    const options = [0, 1, 2, 3].map((index) =>
      String(formData.get(`option-${index}`) ?? "").trim(),
    );
    const optionsUz = [0, 1, 2, 3].map((index) =>
      String(formData.get(`optionUz-${index}`) ?? "").trim(),
    );

    if (
      !text ||
      !textUz ||
      options.some((option) => !option) ||
      optionsUz.some((option) => !option) ||
      !Number.isInteger(correctIndex)
    ) {
      return;
    }

    await prisma.question.create({
      data: {
        type: "QUIZ",
        text,
        textUz,
        track: track.trackName,
        trackId: track.trackId,
        isGlobal: track.isGlobal,
        gradeId: gradeVersion.gradeId,
        versionId: gradeVersion.versionId,
        explanation: explanation || null,
        order: (lastQuestion?.order ?? 0) + 1,
        createdById: admin.id,
        options: {
          create: options.map((option, index) => ({
            label: String.fromCharCode(65 + index),
            text: option,
            textUz: optionsUz[index],
            order: index,
            isCorrect: index === correctIndex,
          })),
        },
      },
    });
  }

  revalidatePath("/admin/questions");
  revalidatePath("/admin");
  redirect(questionRedirectUrl(questionType, track.trackSlug, true, locale));
}

export async function updateQuestionAction(formData: FormData) {
  const locale = await getRequestLocale(formData.get("locale"));
  const profile = await requireAdminAccess({ locale });
  const questionId = String(formData.get("questionId") ?? "");
  const questionType = String(formData.get("questionType") ?? "QUIZ");
  const quizMode = String(formData.get("quizMode") ?? "CHOICE");
  const track = await resolveQuestionTrack(formData);
  await ensureCanManageTrack(profile, track.trackId, locale, track.isGlobal);
  if (!isQuestionTypeAllowedForTrack(questionType, track.trackSlug)) {
    redirect(questionRedirectUrl("QUIZ", track.trackSlug, false, locale));
  }

  const text = clampText(formData.get("text"), MAX_TEXT_LENGTH);
  const textUz = clampText(formData.get("textUz"), MAX_TEXT_LENGTH);
  const explanation = clampText(formData.get("explanation"), MAX_TEXT_LENGTH);

  if (!questionId || !text || !textUz) {
    return;
  }

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { options: { orderBy: { order: "asc" } } },
  });

  if (!question || question.type !== questionType) {
    return;
  }

  // Verify the caller may manage the question's CURRENT track before allowing
  // any edit or track transfer. Without this a track master could move another
  // track's question into their own by supplying a foreign questionId (IDOR).
  await ensureCanManageTrack(profile, question.trackId, locale, question.isGlobal);
  const gradeVersion = await resolveTrackGradeVersion(
    formData,
    track.trackId,
  );

  if (questionType === "SQL_SANDBOX") {
    let apiConfig;
    try {
      apiConfig = addMissionTranslation(
        readSqlSandboxConfig(formData, text),
        textUz,
      );
    } catch {
      return;
    }

    await prisma.question.update({
      where: { id: questionId },
      data: {
        text,
        textUz,
        track: track.trackName,
        trackId: track.trackId,
        isGlobal: track.isGlobal,
        gradeId: gradeVersion.gradeId,
        versionId: gradeVersion.versionId,
        explanation: explanation || null,
        apiConfig,
      },
    });
  } else if (questionType === "MANUAL_QA_SANDBOX") {
    let apiConfig;
    try {
      apiConfig = addMissionTranslation(
        readManualQaSandboxConfig(formData, text),
        textUz,
      );
    } catch {
      return;
    }

    await prisma.question.update({
      where: { id: questionId },
      data: {
        text,
        textUz,
        track: track.trackName,
        trackId: track.trackId,
        isGlobal: track.isGlobal,
        gradeId: gradeVersion.gradeId,
        versionId: gradeVersion.versionId,
        explanation: explanation || null,
        apiConfig,
      },
    });
  } else if (questionType === "AUTOTEST_SANDBOX") {
    let apiConfig;
    try {
      apiConfig = addMissionTranslation(
        readAutotestSandboxConfig(formData, text),
        textUz,
      );
    } catch {
      return;
    }

    await prisma.question.update({
      where: { id: questionId },
      data: {
        text,
        textUz,
        track: track.trackName,
        trackId: track.trackId,
        isGlobal: track.isGlobal,
        gradeId: gradeVersion.gradeId,
        versionId: gradeVersion.versionId,
        explanation: explanation || null,
        apiConfig,
      },
    });
  } else if (
    questionType === "API_SANDBOX" ||
    questionType === "DEVTOOLS_SANDBOX"
  ) {
    const method = String(formData.get("apiMethod") ?? "GET")
      .trim()
      .toUpperCase();
    const path = String(formData.get("apiPath") ?? "").trim();
    const query = String(formData.get("apiQuery") ?? "").trim();
    const headersText = String(formData.get("apiHeaders") ?? "").trim();
    const bodyText = String(formData.get("apiBody") ?? "").trim();
    const successStatus = Number(formData.get("apiSuccessStatus") ?? 200);
    const successBodyText = String(formData.get("apiSuccessBody") ?? "").trim();
    const answerPath = String(formData.get("apiAnswerPath") ?? "").trim();
    const expectedAnswer = String(
      formData.get("apiExpectedAnswer") ?? "",
    ).trim();

    if (!path) {
      return;
    }

    if (
      questionType === "DEVTOOLS_SANDBOX" &&
      (!successBodyText || !answerPath || !expectedAnswer)
    ) {
      return;
    }

    let apiConfig;

    try {
      if (questionType === "API_SANDBOX") {
        apiConfig = {
          mode: "MANUAL_REQUEST",
          method,
          path,
          query: parseQueryString(query),
          headers: parseHeaderLines(headersText),
          body: bodyText ? JSON.parse(bodyText) : undefined,
          successStatus: Number.isFinite(successStatus) ? successStatus : 200,
          successBody: successBodyText
            ? JSON.parse(successBodyText)
            : { ok: true },
        };
      } else {
        apiConfig = {
          mode: "DEVTOOLS_RESPONSE",
          method,
          path,
          query: parseQueryString(query),
          successHeaders: parseHeaderLines(headersText),
          body: bodyText ? JSON.parse(bodyText) : undefined,
          successStatus: Number.isFinite(successStatus) ? successStatus : 200,
          successBody: successBodyText
            ? JSON.parse(successBodyText)
            : { ok: true },
          buttonLabel: String(
            formData.get("apiButtonLabel") ?? "Отправить запрос",
          ).trim(),
          answerLabel: String(formData.get("apiAnswerLabel") ?? "").trim(),
          answerPath,
          expectedAnswer,
        };
      }
    } catch {
      return;
    }

    await prisma.question.update({
      where: { id: questionId },
      data: {
        text,
        textUz,
        track: track.trackName,
        trackId: track.trackId,
        isGlobal: track.isGlobal,
        gradeId: gradeVersion.gradeId,
        versionId: gradeVersion.versionId,
        explanation: explanation || null,
        apiConfig,
      },
    });
  } else if (quizMode === "OPEN_TEXT") {
    const expectedAnswer = String(
      formData.get("openExpectedAnswer") ?? "",
    ).trim();
    const answerLabel = String(formData.get("openAnswerLabel") ?? "").trim();
    const placeholder = String(formData.get("openPlaceholder") ?? "").trim();

    await prisma.$transaction([
      prisma.question.update({
        where: { id: questionId },
        data: {
          text,
          textUz,
          track: track.trackName,
          trackId: track.trackId,
          isGlobal: track.isGlobal,
          gradeId: gradeVersion.gradeId,
          versionId: gradeVersion.versionId,
          explanation: explanation || null,
          apiConfig: {
            mode: "OPEN_TEXT",
            ...(expectedAnswer ? { expectedAnswer } : {}),
            ...(answerLabel ? { answerLabel } : {}),
            ...(placeholder ? { placeholder } : {}),
          },
        },
      }),
      prisma.questionOption.deleteMany({
        where: { questionId },
      }),
    ]);
  } else {
    const correctIndex = Number(formData.get("correctOption"));
    const options = [0, 1, 2, 3].map((index) => ({
      id: String(formData.get(`optionId-${index}`) ?? ""),
      text: String(formData.get(`option-${index}`) ?? "").trim(),
      textUz: String(formData.get(`optionUz-${index}`) ?? "").trim(),
      order: index,
      label: String.fromCharCode(65 + index),
      isCorrect: index === correctIndex,
    }));

    if (
      options.some((option) => !option.text) ||
      options.some((option) => !option.textUz) ||
      !Number.isInteger(correctIndex) ||
      correctIndex < 0 ||
      correctIndex > 3
    ) {
      return;
    }

    await prisma.$transaction([
      prisma.question.update({
        where: { id: questionId },
        data: {
          text,
          textUz,
          track: track.trackName,
          trackId: track.trackId,
          isGlobal: track.isGlobal,
          gradeId: gradeVersion.gradeId,
          versionId: gradeVersion.versionId,
          explanation: explanation || null,
          apiConfig: Prisma.JsonNull,
        },
      }),
      ...options.map((option) =>
        option.id
          ? prisma.questionOption.updateMany({
              where: { id: option.id, questionId },
              data: {
                label: option.label,
                text: option.text,
                textUz: option.textUz,
                order: option.order,
                isCorrect: option.isCorrect,
              },
            })
          : prisma.questionOption.create({
              data: {
                questionId,
                label: option.label,
                text: option.text,
                textUz: option.textUz,
                order: option.order,
                isCorrect: option.isCorrect,
              },
            }),
      ),
    ]);
  }

  revalidatePath("/admin/questions");
  revalidatePath("/admin");
}

export async function reviewAnswerAction(input: {
  answerId: string;
  passed: boolean;
  note: string;
}) {
  const profile = await requireAdminAccess();

  const answer = await prisma.assessmentAnswer.findUnique({
    where: { id: input.answerId },
    include: {
      attempt: { select: { trackId: true } },
      question: { select: { type: true, apiConfig: true } },
    },
  });

  if (
    !answer ||
    (answer.question.type !== "MANUAL_QA_SANDBOX" &&
      answer.question.type !== "AUTOTEST_SANDBOX" &&
      !getOpenQuizConfig(answer.question.apiConfig))
  ) {
    return { ok: false };
  }

  await ensureCanManageTrack(profile, answer.attempt.trackId);

  const prevResponse =
    answer.apiResponse &&
    typeof answer.apiResponse === "object" &&
    !Array.isArray(answer.apiResponse)
      ? (answer.apiResponse as Record<string, unknown>)
      : {};

  const reviewedAt = new Date().toISOString();

  await prisma.assessmentAnswer.update({
    where: { id: input.answerId },
    data: {
      isCorrect: input.passed,
      apiResponse: {
        ...prevResponse,
        adminReview: {
          passed: input.passed,
          note: input.note.trim().slice(0, 500),
          at: reviewedAt,
        },
      },
    },
  });

  revalidatePath(`/admin/attempts/${answer.attemptId}`);
  return { ok: true, at: reviewedAt };
}

export async function toggleQuestionAction(formData: FormData) {
  const profile = await requireAdminAccess();
  const questionId = String(formData.get("questionId") ?? "");
  const isActive = String(formData.get("isActive") ?? "") === "true";

  if (!questionId) return;

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { track: true, trackId: true, type: true, isGlobal: true },
  });
  if (!question) return;

  await ensureCanManageTrack(profile, question?.trackId, undefined, question.isGlobal);

  const data: Prisma.QuestionUpdateInput = { isActive: !isActive };
  if (isActive) {
    const { _max } = await prisma.question.aggregate({
      where: {
        type: question.type,
        track: question.track,
        trackId: question.trackId,
      },
      _max: { order: true },
    });

    data.order = (_max.order ?? 0) + 1;
  }

  await prisma.question.update({
    where: { id: questionId },
    data,
  });

  revalidatePath("/admin/questions");
  revalidatePath("/admin");
}

export async function reorderQuestionsAction(questionIds: string[]) {
  const profile = await requireAdminAccess();
  const uniqueQuestionIds = [...new Set(questionIds)].filter(Boolean);

  if (uniqueQuestionIds.length < 2) return;

  const existingQuestions = await prisma.question.findMany({
    where: { id: { in: uniqueQuestionIds } },
    select: { id: true, trackId: true },
  });

  if (existingQuestions.length !== uniqueQuestionIds.length) return;
  const manageableTrackIds = await getManageableTrackIds(profile);
  if (
    manageableTrackIds &&
    existingQuestions.some(
      (question) => !question.trackId || !manageableTrackIds.includes(question.trackId),
    )
  ) {
    return;
  }

  await prisma.$transaction(
    uniqueQuestionIds.map((questionId, index) =>
      prisma.question.update({
        where: { id: questionId },
        data: { order: index + 1 },
      }),
    ),
  );

  revalidatePath("/admin/questions");
  revalidatePath("/admin");
}

export async function deleteQuestionAction(formData: FormData) {
  const profile = await requireAdminAccess();
  const questionId = String(formData.get("questionId") ?? "");

  if (!questionId) return;

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { trackId: true, isGlobal: true },
  });
  await ensureCanManageTrack(profile, question?.trackId, undefined, question?.isGlobal);

  await prisma.question.delete({
    where: { id: questionId },
  });

  revalidatePath("/admin/questions");
  revalidatePath("/admin");
}

export async function importQuestionsAction(
  _prevState: ImportQuestionsState,
  formData: FormData,
): Promise<ImportQuestionsState> {
  const admin = await requireAdminAccess();
  const track = await resolveQuestionTrack(formData);
  await ensureCanManageTrack(admin, track.trackId);
  if (!isQuestionTypeAllowedForTrack("QUIZ", track.trackSlug)) {
    return { ok: false, message: "Импорт Quiz-вопросов недоступен для этого трека." };
  }

  const gradeVersion = await resolveTrackGradeVersion(formData, track.trackId);
  if (!gradeVersion.gradeId || !gradeVersion.versionId) {
    return {
      ok: false,
      message: "Не удалось определить грейд или версию — создайте их на странице «Треки».",
    };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Выберите JSON-файл с вопросами." };
  }
  if (file.size > MAX_IMPORT_FILE_BYTES) {
    return { ok: false, message: "Файл слишком большой (максимум 2 МБ)." };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(await file.text());
  } catch {
    return { ok: false, message: "Файл не является валидным JSON." };
  }

  const result = validateImportPayload(raw);
  if (!result.ok) {
    return {
      ok: false,
      message: `Импорт отменён: найдено ${result.errors.length} ${
        result.errors.length === 1 ? "ошибка" : "ошибки"
      }. Ни один вопрос не сохранён.`,
      errors: result.errors,
    };
  }

  const lastQuestion = await prisma.question.findFirst({
    orderBy: { order: "desc" },
  });
  let nextOrder = lastQuestion?.order ?? 0;

  await prisma.$transaction(
    result.questions.map((question) => {
      nextOrder += 1;
      const order = nextOrder;

      if (question.mode === "CHOICE") {
        return prisma.question.create({
          data: {
            type: "QUIZ",
            text: question.text,
            textUz: question.textUz,
            track: track.trackName,
            trackId: track.trackId,
            isGlobal: track.isGlobal,
            gradeId: gradeVersion.gradeId,
            versionId: gradeVersion.versionId,
            explanation: question.explanation || null,
            order,
            createdById: admin.id,
            options: {
              create: question.options.map((option, index) => ({
                label: String.fromCharCode(65 + index),
                text: option.text,
                textUz: option.textUz,
                order: index,
                isCorrect: option.isCorrect,
              })),
            },
          },
        });
      }

      return prisma.question.create({
        data: {
          type: "QUIZ",
          text: question.text,
          textUz: question.textUz,
          track: track.trackName,
          trackId: track.trackId,
          isGlobal: track.isGlobal,
          gradeId: gradeVersion.gradeId,
          versionId: gradeVersion.versionId,
          explanation: question.explanation || null,
          order,
          createdById: admin.id,
          apiConfig: {
            mode: "OPEN_TEXT",
            ...(question.expectedAnswer
              ? { expectedAnswer: question.expectedAnswer }
              : {}),
            ...(question.answerLabel ? { answerLabel: question.answerLabel } : {}),
            ...(question.placeholder ? { placeholder: question.placeholder } : {}),
          },
        },
      });
    }),
  );

  revalidatePath("/admin/questions");
  revalidatePath("/admin");

  return {
    ok: true,
    message: `Импортировано ${result.questions.length} вопросов.`,
    importedCount: result.questions.length,
  };
}

export async function createTrackAction(formData: FormData) {
  await requireAdmin();
  const name = clampText(formData.get("name"), MAX_NAME_LENGTH);

  if (!name) return;

  const track = await prisma.track.create({
    data: {
      name,
      slug: await uniqueTrackSlug(name),
      order: await nextTrackOrder(),
    },
  });
  await ensureDefaultWave(track.id);

  revalidatePath("/admin/questions");
  revalidatePath("/admin/settings");
}

export async function updateTrackAction(formData: FormData) {
  await requireAdmin();
  const trackId = String(formData.get("trackId") ?? "");
  const name = clampText(formData.get("name"), MAX_NAME_LENGTH);
  const order = Number(formData.get("order") ?? 0);

  if (!trackId || !name) return;

  await prisma.track.update({
    where: { id: trackId },
    data: {
      name,
      slug: await uniqueTrackSlug(name, trackId),
      order: Number.isFinite(order) ? Math.max(0, Math.round(order)) : 0,
    },
  });

  revalidatePath("/admin/questions");
  revalidatePath("/admin");
}

export async function toggleTrackAction(formData: FormData) {
  await requireAdmin();
  const trackId = String(formData.get("trackId") ?? "");
  const isActive = String(formData.get("isActive") ?? "") === "true";

  if (!trackId) return;

  await prisma.track.update({
    where: { id: trackId },
    data: { isActive: !isActive },
  });

  revalidatePath("/admin/questions");
}

export async function deleteTrackAction(formData: FormData) {
  await requireAdmin();
  const trackId = String(formData.get("trackId") ?? "");

  if (!trackId) return;

  const questionCount = await prisma.question.count({ where: { trackId } });
  if (questionCount > 0) return;

  await prisma.track.delete({ where: { id: trackId } });

  revalidatePath("/admin/questions");
}

export async function createWaveAction(formData: FormData) {
  const profile = await requireAdminAccess();
  const trackId = String(formData.get("trackId") ?? "");
  const name = clampText(formData.get("name"), MAX_NAME_LENGTH);

  if (!trackId || !name) return;
  await ensureCanManageTrack(profile, trackId);

  await prisma.wave.create({
    data: {
      trackId,
      name,
      slug: await uniqueWaveSlug(trackId, name),
      order: await nextWaveOrder(trackId),
    },
  });

  revalidatePath("/admin/tracks");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/interns");
}

export async function updateWaveAction(formData: FormData) {
  const profile = await requireAdminAccess();
  const waveId = String(formData.get("waveId") ?? "");
  const name = clampText(formData.get("name"), MAX_NAME_LENGTH);
  const order = Number(formData.get("order") ?? 0);
  const isActive = String(formData.get("isActive") ?? "") === "on";

  if (!waveId || !name) return;

  const wave = await prisma.wave.findUnique({ where: { id: waveId } });
  if (!wave) return;
  await ensureCanManageTrack(profile, wave.trackId);

  await prisma.wave.update({
    where: { id: waveId },
    data: {
      name,
      slug: await uniqueWaveSlug(wave.trackId, name, waveId),
      order: Number.isFinite(order) ? Math.max(0, Math.round(order)) : 0,
      isActive,
    },
  });

  revalidatePath("/admin/tracks");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/interns");
}

export async function deleteWaveAction(formData: FormData) {
  const profile = await requireAdminAccess();
  const waveId = String(formData.get("waveId") ?? "");

  if (!waveId) return;

  const wave = await prisma.wave.findUnique({ where: { id: waveId } });
  if (!wave) return;
  await ensureCanManageTrack(profile, wave.trackId);

  const usageCount = await prisma.invitation.count({ where: { waveId } }) +
    await prisma.internProfile.count({ where: { waveId } }) +
    await prisma.assessmentAttempt.count({ where: { waveId } });
  if (usageCount > 0) return;

  await prisma.wave.delete({ where: { id: waveId } });

  revalidatePath("/admin/tracks");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/interns");
}

export async function createGradeAction(formData: FormData) {
  const profile = await requireAdminAccess();
  const trackId = String(formData.get("trackId") ?? "");
  const name = clampText(formData.get("name"), MAX_NAME_LENGTH);

  if (!trackId || !name) return;
  await ensureCanManageTrack(profile, trackId);

  const grade = await prisma.grade.create({
    data: {
      trackId,
      name,
      slug: await uniqueGradeSlug(trackId, name),
      order: await nextGradeOrder(trackId),
    },
  });
  await ensureDefaultVersion(grade.id);

  revalidatePath("/admin/tracks");
  revalidatePath("/admin/questions");
}

export async function updateGradeAction(formData: FormData) {
  const profile = await requireAdminAccess();
  const gradeId = String(formData.get("gradeId") ?? "");
  const name = clampText(formData.get("name"), MAX_NAME_LENGTH);
  const order = Number(formData.get("order") ?? 0);
  const isActive = String(formData.get("isActive") ?? "") === "on";

  if (!gradeId || !name) return;

  const grade = await prisma.grade.findUnique({ where: { id: gradeId } });
  if (!grade) return;
  await ensureCanManageTrack(profile, grade.trackId);

  await prisma.grade.update({
    where: { id: gradeId },
    data: {
      name,
      slug: await uniqueGradeSlug(grade.trackId, name, gradeId),
      order: Number.isFinite(order) ? Math.max(0, Math.round(order)) : 0,
      isActive,
    },
  });

  revalidatePath("/admin/tracks");
  revalidatePath("/admin/questions");
}

export async function deleteGradeAction(formData: FormData) {
  const profile = await requireAdminAccess();
  const gradeId = String(formData.get("gradeId") ?? "");

  if (!gradeId) return;

  const grade = await prisma.grade.findUnique({ where: { id: gradeId } });
  if (!grade) return;
  await ensureCanManageTrack(profile, grade.trackId);

  const usageCount = await prisma.invitation.count({ where: { gradeId } }) +
    await prisma.internProfile.count({ where: { gradeId } }) +
    await prisma.assessmentAttempt.count({ where: { gradeId } }) +
    await prisma.question.count({ where: { gradeId } });
  if (usageCount > 0) return;

  await prisma.grade.delete({ where: { id: gradeId } });

  revalidatePath("/admin/tracks");
  revalidatePath("/admin/questions");
}

export async function createQuestionVersionAction(formData: FormData) {
  const profile = await requireAdminAccess();
  const gradeId = String(formData.get("gradeId") ?? "");

  if (!gradeId) return;

  const grade = await prisma.grade.findUnique({ where: { id: gradeId } });
  if (!grade) return;
  await ensureCanManageTrack(profile, grade.trackId);

  await prisma.questionVersion.create({
    data: {
      gradeId,
      name: await nextVersionName(gradeId),
      isActive: false,
      createdById: profile.id,
    },
  });

  revalidatePath("/admin/questions");
}

export async function duplicateQuestionVersionAction(formData: FormData) {
  const profile = await requireAdminAccess();
  const sourceVersionId = String(formData.get("versionId") ?? "");

  if (!sourceVersionId) return;

  const sourceVersion = await prisma.questionVersion.findUnique({
    where: { id: sourceVersionId },
    include: { grade: true },
  });
  if (!sourceVersion) return;
  await ensureCanManageTrack(profile, sourceVersion.grade.trackId);

  const sourceQuestions = await prisma.question.findMany({
    where: { versionId: sourceVersionId },
    include: { options: true },
    orderBy: { order: "asc" },
  });

  await prisma.$transaction(async (tx) => {
    const newVersion = await tx.questionVersion.create({
      data: {
        gradeId: sourceVersion.gradeId,
        name: await nextVersionName(sourceVersion.gradeId),
        isActive: false,
        createdById: profile.id,
      },
    });

    for (const question of sourceQuestions) {
      await tx.question.create({
        data: {
          type: question.type,
          track: question.track,
          trackId: question.trackId,
          gradeId: question.gradeId,
          versionId: newVersion.id,
          text: question.text,
          textUz: question.textUz,
          explanation: question.explanation,
          isActive: question.isActive,
          order: question.order,
          apiConfig: question.apiConfig as Prisma.InputJsonValue,
          createdById: profile.id,
          options: {
            create: question.options.map((option) => ({
              label: option.label,
              text: option.text,
              textUz: option.textUz,
              isCorrect: option.isCorrect,
              order: option.order,
            })),
          },
        },
      });
    }
  });

  revalidatePath("/admin/questions");
}

export async function activateQuestionVersionAction(formData: FormData) {
  const profile = await requireAdminAccess();
  const versionId = String(formData.get("versionId") ?? "");

  if (!versionId) return;

  const version = await prisma.questionVersion.findUnique({
    where: { id: versionId },
    include: { grade: true },
  });
  if (!version) return;
  await ensureCanManageTrack(profile, version.grade.trackId);

  await prisma.$transaction([
    prisma.questionVersion.updateMany({
      where: { gradeId: version.gradeId, id: { not: versionId } },
      data: { isActive: false },
    }),
    prisma.questionVersion.update({
      where: { id: versionId },
      data: { isActive: true },
    }),
  ]);

  revalidatePath("/admin/questions");
}

export async function deleteQuestionVersionAction(formData: FormData) {
  const profile = await requireAdminAccess();
  const versionId = String(formData.get("versionId") ?? "");

  if (!versionId) return;

  const version = await prisma.questionVersion.findUnique({
    where: { id: versionId },
    include: { grade: true },
  });
  if (!version) return;
  await ensureCanManageTrack(profile, version.grade.trackId);
  if (version.isActive) return;

  const usageCount = await prisma.assessmentAnswer.count({
    where: { question: { versionId } },
  });
  if (usageCount > 0) return;

  await prisma.$transaction([
    prisma.question.deleteMany({ where: { versionId } }),
    prisma.questionVersion.delete({ where: { id: versionId } }),
  ]);

  revalidatePath("/admin/questions");
}

export async function renameQuestionVersionAction(formData: FormData) {
  const profile = await requireAdminAccess();
  const versionId = String(formData.get("versionId") ?? "");
  const name = clampText(formData.get("name"), MAX_NAME_LENGTH);

  if (!versionId || !name) return;

  const version = await prisma.questionVersion.findUnique({
    where: { id: versionId },
    include: { grade: true },
  });
  if (!version) return;
  await ensureCanManageTrack(profile, version.grade.trackId);

  await prisma.questionVersion.update({
    where: { id: versionId },
    data: { name },
  });

  revalidatePath("/admin/questions");
}

export async function createTrackMasterAction(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim() || null;
  const lastName = String(formData.get("lastName") ?? "").trim() || null;
  const trackIds = formData.getAll("trackIds").map(String).filter(Boolean);

  if (
    !email ||
    !email.includes("@") ||
    trackIds.length === 0 ||
    passwordPolicyError(password)
  ) {
    return;
  }

  const existing = await prisma.profile.findUnique({ where: { email } });
  if (existing && existing.role !== "TRACK_MASTER") return;

  const { hashPassword } = await import("@/lib/admin-auth");
  const profile = existing
    ? await prisma.profile.update({
        where: { id: existing.id },
        data: {
          firstName,
          lastName,
          passwordHash: hashPassword(password),
        },
      })
    : await prisma.profile.create({
        data: {
          email,
          firstName,
          lastName,
          role: "TRACK_MASTER",
          passwordHash: hashPassword(password),
        },
      });
  if (!profile) return;

  await prisma.$transaction([
    prisma.trackMember.deleteMany({ where: { profileId: profile.id } }),
    ...trackIds.map((trackId) =>
      prisma.trackMember.create({
        data: { profileId: profile.id, trackId, role: "TRACK_MASTER" },
      }),
    ),
  ]);

  revalidatePath("/admin/settings");
}

export async function assignTrackMasterAction(formData: FormData) {
  await requireAdmin();
  const trackId = String(formData.get("trackId") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim() || null;
  const lastName = String(formData.get("lastName") ?? "").trim() || null;

  if (!trackId || !email || !email.includes("@")) return;

  const existing = await prisma.profile.findUnique({ where: { email } });
  if (existing && existing.role !== "TRACK_MASTER") return;
  // A new profile must set a policy-compliant password; for an existing profile
  // the password is optional, but if supplied it must still satisfy the policy.
  if (password ? passwordPolicyError(password) : !existing) return;

  const { hashPassword } = await import("@/lib/admin-auth");
  const profile = existing
    ? await prisma.profile.update({
        where: { id: existing.id },
        data: {
          firstName: firstName ?? existing.firstName,
          lastName: lastName ?? existing.lastName,
          ...(password ? { passwordHash: hashPassword(password) } : {}),
        },
      })
    : await prisma.profile.create({
        data: {
          email,
          firstName,
          lastName,
          role: "TRACK_MASTER",
          passwordHash: hashPassword(password),
        },
      });

  await prisma.trackMember.upsert({
    where: {
      profileId_trackId_role: {
        profileId: profile.id,
        trackId,
        role: "TRACK_MASTER",
      },
    },
    update: {},
    create: { profileId: profile.id, trackId, role: "TRACK_MASTER" },
  });

  revalidatePath("/admin/tracks");
  revalidatePath("/admin/settings");
}

export async function removeTrackMasterFromTrackAction(formData: FormData) {
  await requireAdmin();
  const profileId = String(formData.get("profileId") ?? "");
  const trackId = String(formData.get("trackId") ?? "");

  if (!profileId || !trackId) return;

  await prisma.trackMember.deleteMany({
    where: { profileId, trackId, role: "TRACK_MASTER" },
  });

  revalidatePath("/admin/tracks");
  revalidatePath("/admin/settings");
}

export async function deleteTrackMasterAction(formData: FormData) {
  await requireAdmin();
  const profileId = String(formData.get("profileId") ?? "");

  if (!profileId) return;

  await prisma.$transaction([
    prisma.adminSession.deleteMany({ where: { profileId } }),
    prisma.trackMember.deleteMany({ where: { profileId } }),
    prisma.profile.update({
      where: { id: profileId },
      data: {
        email: `deleted-track-master-${profileId}@deleted.local`,
        passwordHash: null,
        firstName: "Deleted",
        lastName: "Track Master",
      },
    }),
  ]);

  revalidatePath("/admin/settings");
  revalidatePath("/admin/tracks");
}

export async function createRetakeInvitationAction(
  _prevState: InvitationState,
  formData: FormData,
): Promise<InvitationState> {
  const admin = await requireAdminAccess();
  const internProfileId = String(formData.get("internProfileId") ?? "");

  if (!internProfileId) {
    return { ok: false, message: "Не удалось определить стажёра." };
  }

  const intern = await prisma.internProfile.findUnique({
    where: { id: internProfileId },
    include: {
      profile: true,
      attempts: {
        orderBy: { startedAt: "desc" },
        take: 1,
      },
      invitation: true,
    },
  });

  if (!intern) {
    return { ok: false, message: "Профиль стажёра не найден." };
  }

  const latestAttempt = intern.attempts[0];
  const currentLatestAttempt =
    latestAttempt?.status === "IN_PROGRESS" &&
    latestAttempt.deadlineAt.getTime() <= Date.now()
      ? await expireAttemptIfNeeded(latestAttempt.id)
      : latestAttempt;

  if (currentLatestAttempt?.status === "IN_PROGRESS") {
    return {
      ok: false,
      message:
        "Нельзя выдать повторный доступ, пока текущая попытка не завершена.",
    };
  }

  const inviteCode = generateInviteCode();
  const inviteCodeMask = maskInviteCode(inviteCode);
  const inviteCodeEncrypted = encryptInviteCode(inviteCode);
  const expiresAt = getInvitationExpiresAt();

  const fallbackScope = await resolveInvitationScope(formData);
  const trackId = intern.trackId ?? intern.invitation?.trackId ?? fallbackScope.trackId;
  const waveId = intern.waveId ?? intern.invitation?.waveId ?? fallbackScope.waveId;
  const gradeId = intern.gradeId ?? intern.invitation?.gradeId ?? fallbackScope.gradeId;
  await ensureCanManageTrack(admin, trackId);

  const createdInvitation = await prisma.$transaction(async (tx) => {
    const invitation = await tx.invitation.create({
      data: {
        candidateName: intern.fullName,
        inviteCodeHash: hashInviteCode(inviteCode),
        inviteCodeMask,
        inviteCodeEncrypted,
        expiresAt,
        createdById: admin.id,
        trackId,
        waveId,
        gradeId,
      },
    });

    if (intern.invitationId) {
      await tx.invitation.update({
        where: { id: intern.invitationId },
        data: {
          acceptedByProfileId: null,
        },
      });
    }

    await tx.internProfile.update({
      where: { id: intern.id },
      data: {
        invitationId: invitation.id,
        trackId,
        waveId,
        gradeId,
      },
    });

    return invitation;
  });

  revalidatePath("/admin/interns");

  return {
    ok: true,
    message: "Новый токен для повторного прохождения создан.",
    inviteCode,
    invitation: {
      id: createdInvitation.id,
      candidateName: createdInvitation.candidateName,
      inviteCodeMask: createdInvitation.inviteCodeMask ?? "••••",
      inviteCodeCopyValue: inviteCode,
      status: createdInvitation.status,
      createdAt: formatInvitationDateTime(createdInvitation.createdAt),
      acceptedAt: formatInvitationDateTime(createdInvitation.acceptedAt),
      canRevoke: createdInvitation.status === "PENDING",
    },
  };
}
