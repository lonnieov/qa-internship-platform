"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { expireAttemptIfNeeded } from "@/lib/assessment";
import { parseHeaderLines, parseQueryString } from "@/lib/api-sandbox";
import { getManageableTrackIds, requireAdmin, requireAdminAccess } from "@/lib/auth";
import { getOpenQuizConfig } from "@/lib/open-quiz";
import { normalizeLegacyTrack } from "@/lib/question-classification";
import { isQuestionTypeAllowedForTrack } from "@/lib/question-type-policy";
import {
  encryptInviteCode,
  generateInviteCode,
  hashInviteCode,
  maskInviteCode,
} from "@/lib/security";
import { ensureTracks, nextTrackOrder, uniqueTrackSlug } from "@/lib/tracks";
import { ensureDefaultWave, nextWaveOrder, uniqueWaveSlug } from "@/lib/waves";
import {
  clickSuperAppClickAvtoPresetConfig,
  manualQaPresetOptions,
  type ManualQaKnownBug,
} from "@/lib/manual-qa-sandbox";
import {
  autotestPresetOptions,
  clickAvtoTintingPresetConfig,
  type AutotestScenario,
} from "@/lib/autotest-sandbox";
import {
  getSqlSandboxConfig,
  sampleSqlSandboxConfig,
} from "@/lib/sql-sandbox-config";

const defaultInvitationExpiryDays = 14;

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

async function canManageTrack(profile: { id: string; role: string }, trackId: string | null | undefined) {
  if (!trackId) return false;
  const manageableTrackIds = await getManageableTrackIds(profile);
  return !manageableTrackIds || manageableTrackIds.includes(trackId);
}

async function ensureCanManageTrack(profile: { id: string; role: string }, trackId: string | null | undefined) {
  if (!(await canManageTrack(profile, trackId))) {
    redirect("/admin");
  }
}

async function resolveInvitationScope(formData?: FormData) {
  const waveId = String(formData?.get("waveId") ?? "");
  const selectedWave = waveId
    ? await prisma.wave.findUnique({ where: { id: waveId } })
    : null;

  if (selectedWave) {
    return {
      trackId: selectedWave.trackId,
      waveId: selectedWave.id,
    };
  }

  const tracks = await ensureTracks();
  const track = tracks.find((item) => item.slug === "qa") ?? tracks[0] ?? null;
  const wave = track ? await ensureDefaultWave(track.id) : null;

  return {
    trackId: track?.id ?? null,
    waveId: wave?.id ?? null,
  };
}

async function resolveQuestionTrack(formData: FormData) {
  const trackId = String(formData.get("trackId") ?? "");
  const selectedTrack = trackId
    ? await prisma.track.findUnique({ where: { id: trackId } })
    : null;

  if (selectedTrack) {
    return {
      trackId: selectedTrack.id,
      trackSlug: selectedTrack.slug,
      trackName: selectedTrack.name,
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
  };
}

function questionRedirectUrl(
  questionType: string,
  trackSlug: string,
  created = false,
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

  return `/admin/questions?${params.toString()}`;
}

function readManualQaSandboxConfig(formData: FormData, text: string) {
  const presetId = String(
    formData.get("manualQaPreset") ??
      clickSuperAppClickAvtoPresetConfig.appPreset,
  );
  const preset =
    manualQaPresetOptions.find((option) => option.value === presetId)?.config ??
    clickSuperAppClickAvtoPresetConfig;
  const scenarioTitle = String(
    formData.get("manualQaScenarioTitle") ?? preset.scenarioTitle,
  ).trim();
  const viewportWidth = Number(formData.get("manualQaViewportWidth"));
  const viewportHeight = Number(formData.get("manualQaViewportHeight"));
  const timeHintMinutes = Number(formData.get("manualQaTimeHintMinutes"));
  const categories = String(formData.get("manualQaCategories") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const knownBugsText = String(formData.get("manualQaKnownBugs") ?? "").trim();

  let knownBugs: ManualQaKnownBug[] = preset.knownBugs;
  if (knownBugsText) {
    const parsed = JSON.parse(knownBugsText);
    if (!Array.isArray(parsed)) {
      throw new Error("Known bugs must be an array.");
    }

    knownBugs = parsed
      .filter(
        (item): item is Partial<ManualQaKnownBug> =>
          Boolean(item) && typeof item === "object" && !Array.isArray(item),
      )
      .map((item) => ({
        id: String(item.id ?? "").trim(),
        title: String(item.title ?? "").trim(),
        severity:
          item.severity === "blocker" ||
          item.severity === "critical" ||
          item.severity === "major" ||
          item.severity === "minor" ||
          item.severity === "trivial"
            ? item.severity
            : "major",
        matchKeywords: Array.isArray(item.matchKeywords)
          ? item.matchKeywords.map((keyword) => String(keyword)).filter(Boolean)
          : [],
      }))
      .filter((item) => item.id && item.title);
  }

  return {
    mode: "MANUAL_QA_SANDBOX" as const,
    scenarioTitle: scenarioTitle || preset.scenarioTitle,
    mission: text || preset.mission,
    appPreset: preset.appPreset,
    viewport: {
      width: Number.isFinite(viewportWidth)
        ? Math.min(Math.max(Math.round(viewportWidth), 320), 520)
        : preset.viewport.width,
      height: Number.isFinite(viewportHeight)
        ? Math.min(Math.max(Math.round(viewportHeight), 568), 980)
        : preset.viewport.height,
    },
    timeHintMinutes: Number.isFinite(timeHintMinutes)
      ? Math.min(Math.max(Math.round(timeHintMinutes), 1), 60)
      : preset.timeHintMinutes,
    bugCategories: categories.length > 0 ? categories : preset.bugCategories,
    knownBugs,
  };
}

function readAutotestSandboxConfig(formData: FormData, text: string) {
  const presetId = String(
    formData.get("autotestPreset") ?? clickAvtoTintingPresetConfig.appPreset,
  );
  const preset =
    autotestPresetOptions.find((option) => option.value === presetId)?.config ??
    clickAvtoTintingPresetConfig;
  const scenarioTitle = String(
    formData.get("autotestScenarioTitle") ?? preset.scenarioTitle,
  ).trim();
  const timeHintMinutes = Number(formData.get("autotestTimeHintMinutes"));
  const scenariosText = String(
    formData.get("autotestExpectedScenarios") ?? "",
  ).trim();

  let expectedScenarios: AutotestScenario[] = preset.expectedScenarios;
  if (scenariosText) {
    const parsed = JSON.parse(scenariosText);
    if (!Array.isArray(parsed)) {
      throw new Error("Expected scenarios must be an array.");
    }

    expectedScenarios = parsed
      .filter(
        (item): item is Partial<AutotestScenario> =>
          Boolean(item) && typeof item === "object" && !Array.isArray(item),
      )
      .map((item) => ({
        id: String(item.id ?? "").trim(),
        title: String(item.title ?? "").trim(),
        required: item.required !== false,
        matchKeywords: Array.isArray(item.matchKeywords)
          ? item.matchKeywords.map((kw) => String(kw)).filter(Boolean)
          : [],
      }))
      .filter((item) => item.id && item.title);
  }

  return {
    mode: "AUTOTEST_SANDBOX" as const,
    scenarioTitle: scenarioTitle || preset.scenarioTitle,
    mission: text || preset.mission,
    appPreset: preset.appPreset,
    timeHintMinutes: Number.isFinite(timeHintMinutes)
      ? Math.min(Math.max(Math.round(timeHintMinutes), 5), 60)
      : preset.timeHintMinutes,
    availableMethods: preset.availableMethods,
    expectedScenarios,
    exampleCode: preset.exampleCode,
  };
}

function readSqlSandboxConfig(formData: FormData, text: string) {
  const taskTitle = String(
    formData.get("sqlTaskTitle") ?? sampleSqlSandboxConfig.taskTitle,
  ).trim();
  const tablesText = String(formData.get("sqlTables") ?? "").trim();
  const expectedText = String(formData.get("sqlExpectedResult") ?? "").trim();

  const config = getSqlSandboxConfig({
    mode: "SQL_SANDBOX",
    taskTitle,
    mission: text,
    dialect: sampleSqlSandboxConfig.dialect,
    tables: tablesText ? JSON.parse(tablesText) : sampleSqlSandboxConfig.tables,
    expectedResult: expectedText
      ? JSON.parse(expectedText)
      : sampleSqlSandboxConfig.expectedResult,
  });

  if (!config) {
    throw new Error("Invalid SQL sandbox config");
  }

  return config;
}

export async function createInvitationAction(
  _prevState: InvitationState,
  formData: FormData,
): Promise<InvitationState> {
  const admin = await requireAdminAccess();
  const candidateName = String(formData.get("candidateName") ?? "").trim();

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
  const admin = await requireAdminAccess();
  const questionType = String(formData.get("questionType") ?? "QUIZ");
  const quizMode = String(formData.get("quizMode") ?? "CHOICE");
  const track = await resolveQuestionTrack(formData);
  await ensureCanManageTrack(admin, track.trackId);
  if (!isQuestionTypeAllowedForTrack(questionType, track.trackSlug)) {
    redirect(questionRedirectUrl("QUIZ", track.trackSlug));
  }

  const text = String(formData.get("text") ?? "").trim();
  const explanation = String(formData.get("explanation") ?? "").trim();

  const lastQuestion = await prisma.question.findFirst({
    orderBy: { order: "desc" },
  });

  if (questionType === "SQL_SANDBOX") {
    if (!text) {
      return;
    }

    let apiConfig;
    try {
      apiConfig = readSqlSandboxConfig(formData, text);
    } catch {
      return;
    }

    await prisma.question.create({
      data: {
        type: "SQL_SANDBOX",
        text,
        track: track.trackName,
        trackId: track.trackId,
        explanation: explanation || null,
        order: (lastQuestion?.order ?? 0) + 1,
        createdById: admin.id,
        apiConfig,
      },
    });
  } else if (questionType === "MANUAL_QA_SANDBOX") {
    if (!text) {
      return;
    }

    let apiConfig;
    try {
      apiConfig = readManualQaSandboxConfig(formData, text);
    } catch {
      return;
    }

    await prisma.question.create({
      data: {
        type: "MANUAL_QA_SANDBOX",
        text,
        track: track.trackName,
        trackId: track.trackId,
        explanation: explanation || null,
        order: (lastQuestion?.order ?? 0) + 1,
        createdById: admin.id,
        apiConfig,
      },
    });
  } else if (questionType === "AUTOTEST_SANDBOX") {
    if (!text) {
      return;
    }

    let apiConfig;
    try {
      apiConfig = readAutotestSandboxConfig(formData, text);
    } catch {
      return;
    }

    await prisma.question.create({
      data: {
        type: "AUTOTEST_SANDBOX",
        text,
        track: track.trackName,
        trackId: track.trackId,
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

    if (!text || !path) {
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
        track: track.trackName,
        trackId: track.trackId,
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

      if (!text) {
        return;
      }

      await prisma.question.create({
        data: {
          type: "QUIZ",
          text,
          track: track.trackName,
          trackId: track.trackId,
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
      redirect(questionRedirectUrl(questionType, track.trackSlug, true));
    }

    const correctIndex = Number(formData.get("correctOption"));
    const options = [0, 1, 2, 3].map((index) =>
      String(formData.get(`option-${index}`) ?? "").trim(),
    );

    if (
      !text ||
      options.some((option) => !option) ||
      !Number.isInteger(correctIndex)
    ) {
      return;
    }

    await prisma.question.create({
      data: {
        type: "QUIZ",
        text,
        track: track.trackName,
        trackId: track.trackId,
        explanation: explanation || null,
        order: (lastQuestion?.order ?? 0) + 1,
        createdById: admin.id,
        options: {
          create: options.map((option, index) => ({
            label: String.fromCharCode(65 + index),
            text: option,
            order: index,
            isCorrect: index === correctIndex,
          })),
        },
      },
    });
  }

  revalidatePath("/admin/questions");
  revalidatePath("/admin");
  redirect(questionRedirectUrl(questionType, track.trackSlug, true));
}

export async function updateQuestionAction(formData: FormData) {
  const profile = await requireAdminAccess();
  const questionId = String(formData.get("questionId") ?? "");
  const questionType = String(formData.get("questionType") ?? "QUIZ");
  const quizMode = String(formData.get("quizMode") ?? "CHOICE");
  const track = await resolveQuestionTrack(formData);
  await ensureCanManageTrack(profile, track.trackId);
  if (!isQuestionTypeAllowedForTrack(questionType, track.trackSlug)) {
    redirect(questionRedirectUrl("QUIZ", track.trackSlug));
  }

  const text = String(formData.get("text") ?? "").trim();
  const explanation = String(formData.get("explanation") ?? "").trim();

  if (!questionId || !text) {
    return;
  }

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { options: { orderBy: { order: "asc" } } },
  });

  if (!question || question.type !== questionType) {
    return;
  }

  if (questionType === "SQL_SANDBOX") {
    let apiConfig;
    try {
      apiConfig = readSqlSandboxConfig(formData, text);
    } catch {
      return;
    }

    await prisma.question.update({
      where: { id: questionId },
      data: {
        text,
        track: track.trackName,
        trackId: track.trackId,
        explanation: explanation || null,
        apiConfig,
      },
    });
  } else if (questionType === "MANUAL_QA_SANDBOX") {
    let apiConfig;
    try {
      apiConfig = readManualQaSandboxConfig(formData, text);
    } catch {
      return;
    }

    await prisma.question.update({
      where: { id: questionId },
      data: {
        text,
        track: track.trackName,
        trackId: track.trackId,
        explanation: explanation || null,
        apiConfig,
      },
    });
  } else if (questionType === "AUTOTEST_SANDBOX") {
    let apiConfig;
    try {
      apiConfig = readAutotestSandboxConfig(formData, text);
    } catch {
      return;
    }

    await prisma.question.update({
      where: { id: questionId },
      data: {
        text,
        track: track.trackName,
        trackId: track.trackId,
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
        track: track.trackName,
        trackId: track.trackId,
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
          track: track.trackName,
          trackId: track.trackId,
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
      order: index,
      label: String.fromCharCode(65 + index),
      isCorrect: index === correctIndex,
    }));

    if (
      options.some((option) => !option.text) ||
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
          track: track.trackName,
          trackId: track.trackId,
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
                order: option.order,
                isCorrect: option.isCorrect,
              },
            })
          : prisma.questionOption.create({
              data: {
                questionId,
                label: option.label,
                text: option.text,
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

  await prisma.assessmentAnswer.update({
    where: { id: input.answerId },
    data: {
      isCorrect: input.passed,
      apiResponse: {
        ...prevResponse,
        adminReview: {
          passed: input.passed,
          note: input.note.trim().slice(0, 500),
          at: new Date().toISOString(),
        },
      },
    },
  });

  revalidatePath(`/admin/attempts/${answer.attemptId}`);
  return { ok: true };
}

export async function toggleQuestionAction(formData: FormData) {
  const profile = await requireAdminAccess();
  const questionId = String(formData.get("questionId") ?? "");
  const isActive = String(formData.get("isActive") ?? "") === "true";

  if (!questionId) return;

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { trackId: true },
  });
  await ensureCanManageTrack(profile, question?.trackId);

  await prisma.question.update({
    where: { id: questionId },
    data: { isActive: !isActive },
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
    select: { trackId: true },
  });
  await ensureCanManageTrack(profile, question?.trackId);

  await prisma.question.delete({
    where: { id: questionId },
  });

  revalidatePath("/admin/questions");
  revalidatePath("/admin");
}

export async function createTrackAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();

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
  const name = String(formData.get("name") ?? "").trim();
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
  const name = String(formData.get("name") ?? "").trim();

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
  const name = String(formData.get("name") ?? "").trim();
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

export async function createTrackMasterAction(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim() || null;
  const lastName = String(formData.get("lastName") ?? "").trim() || null;
  const trackIds = formData.getAll("trackIds").map(String).filter(Boolean);

  if (!email || !email.includes("@") || password.length < 6 || trackIds.length === 0) {
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
  if (!existing && password.length < 6) return;

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
