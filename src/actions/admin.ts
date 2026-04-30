"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { parseHeaderLines, parseQueryString } from "@/lib/api-sandbox";
import { requireAdmin } from "@/lib/auth";
import { normalizeLegacyTrack } from "@/lib/question-classification";
import { generateInviteCode, hashInviteCode } from "@/lib/security";
import { nextTrackOrder, uniqueTrackSlug } from "@/lib/tracks";
import {
  clickSuperAppClickAvtoPresetConfig,
  manualQaPresetOptions,
  type ManualQaKnownBug,
} from "@/lib/manual-qa-sandbox";

export type InvitationState = {
  ok: boolean;
  message: string;
  inviteCode?: string;
};

async function resolveQuestionTrack(formData: FormData) {
  const trackId = String(formData.get("trackId") ?? "");
  const track = trackId
    ? await prisma.track.findUnique({ where: { id: trackId } })
    : null;

  return {
    trackId: track?.id ?? null,
    trackSlug: track?.slug ?? "all",
    trackName:
      track?.name ?? normalizeLegacyTrack(String(formData.get("track") ?? "")),
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
      questionType === "MANUAL_QA_SANDBOX"
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

export async function createInvitationAction(
  _prevState: InvitationState,
  formData: FormData,
): Promise<InvitationState> {
  const admin = await requireAdmin();
  const candidateName = String(formData.get("candidateName") ?? "").trim();
  const expiresInDays = Number(formData.get("expiresInDays") ?? 14);

  if (!candidateName) {
    return { ok: false, message: "Укажите имя и фамилию кандидата." };
  }

  const inviteCode = generateInviteCode();
  const expiresAt = Number.isFinite(expiresInDays)
    ? new Date(Date.now() + Math.max(1, expiresInDays) * 24 * 60 * 60 * 1000)
    : null;

  await prisma.invitation.create({
    data: {
      candidateName,
      inviteCodeHash: hashInviteCode(inviteCode),
      expiresAt,
      createdById: admin.id,
    },
  });

  revalidatePath("/admin/interns");

  return {
    ok: true,
    message: "Токен создан. Он показывается только сейчас.",
    inviteCode,
  };
}

export async function revokeInvitationAction(formData: FormData) {
  await requireAdmin();
  const invitationId = String(formData.get("invitationId") ?? "");

  if (!invitationId) return;

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
  const admin = await requireAdmin();
  const questionType = String(formData.get("questionType") ?? "QUIZ");
  const quizMode = String(formData.get("quizMode") ?? "CHOICE");
  const track = await resolveQuestionTrack(formData);
  const text = String(formData.get("text") ?? "").trim();
  const explanation = String(formData.get("explanation") ?? "").trim();

  const lastQuestion = await prisma.question.findFirst({
    orderBy: { order: "desc" },
  });

  if (questionType === "MANUAL_QA_SANDBOX") {
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
  await requireAdmin();
  const questionId = String(formData.get("questionId") ?? "");
  const questionType = String(formData.get("questionType") ?? "QUIZ");
  const quizMode = String(formData.get("quizMode") ?? "CHOICE");
  const track = await resolveQuestionTrack(formData);
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

  if (questionType === "MANUAL_QA_SANDBOX") {
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

export async function toggleQuestionAction(formData: FormData) {
  await requireAdmin();
  const questionId = String(formData.get("questionId") ?? "");
  const isActive = String(formData.get("isActive") ?? "") === "true";

  if (!questionId) return;

  await prisma.question.update({
    where: { id: questionId },
    data: { isActive: !isActive },
  });

  revalidatePath("/admin/questions");
  revalidatePath("/admin");
}

export async function reorderQuestionsAction(questionIds: string[]) {
  await requireAdmin();
  const uniqueQuestionIds = [...new Set(questionIds)].filter(Boolean);

  if (uniqueQuestionIds.length < 2) return;

  const existingQuestions = await prisma.question.findMany({
    where: { id: { in: uniqueQuestionIds } },
    select: { id: true },
  });

  if (existingQuestions.length !== uniqueQuestionIds.length) return;

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
  await requireAdmin();
  const questionId = String(formData.get("questionId") ?? "");

  if (!questionId) return;

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

  await prisma.track.create({
    data: {
      name,
      slug: await uniqueTrackSlug(name),
      order: await nextTrackOrder(),
    },
  });

  revalidatePath("/admin/questions");
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

export async function createRetakeInvitationAction(
  _prevState: InvitationState,
  formData: FormData,
): Promise<InvitationState> {
  const admin = await requireAdmin();
  const internProfileId = String(formData.get("internProfileId") ?? "");
  const expiresInDays = Number(formData.get("expiresInDays") ?? 14);

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

  if (intern.attempts[0]?.status === "IN_PROGRESS") {
    return {
      ok: false,
      message:
        "Нельзя выдать повторный доступ, пока текущая попытка не завершена.",
    };
  }

  const inviteCode = generateInviteCode();
  const expiresAt = Number.isFinite(expiresInDays)
    ? new Date(Date.now() + Math.max(1, expiresInDays) * 24 * 60 * 60 * 1000)
    : null;

  await prisma.$transaction(async (tx) => {
    const invitation = await tx.invitation.create({
      data: {
        candidateName: intern.fullName,
        inviteCodeHash: hashInviteCode(inviteCode),
        expiresAt,
        createdById: admin.id,
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
      },
    });
  });

  revalidatePath("/admin/interns");

  return {
    ok: true,
    message: "Новый токен для повторного прохождения создан.",
    inviteCode,
  };
}
