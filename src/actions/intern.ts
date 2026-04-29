"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  evaluateApiSandboxRequest,
  getJsonPathValue,
  normalizeAnswerValue,
  normalizeApiSandboxConfig,
} from "@/lib/api-sandbox";
import { prisma } from "@/lib/prisma";
import { getCurrentProfile, requireIntern } from "@/lib/auth";
import { expireAttemptIfNeeded, finalizeAttempt, getSettings } from "@/lib/assessment";
import { hashInviteCode } from "@/lib/security";
import {
  clearInternSession,
  createResultSession,
  createInternSession,
  internSyntheticUserId,
} from "@/lib/intern-token-auth";

export type InternTokenLoginState = {
  ok: boolean;
  message: string;
};

function splitName(fullName: string) {
  const [firstName, ...rest] = fullName.trim().split(/\s+/);
  return {
    firstName: firstName || null,
    lastName: rest.length > 0 ? rest.join(" ") : null,
  };
}

export async function loginInternByTokenAction(
  _prevState: InternTokenLoginState,
  formData: FormData,
): Promise<InternTokenLoginState> {
  const token = String(formData.get("token") ?? "");
  const invitation = await prisma.invitation.findUnique({
    where: { inviteCodeHash: hashInviteCode(token) },
    include: {
      internProfile: {
        include: { profile: true },
      },
    },
  });

  if (!invitation || invitation.status === "REVOKED") {
    return { ok: false, message: "Токен недействителен." };
  }

  if (invitation.status === "COMPLETED") {
    return { ok: false, message: "Тест по этому токену уже завершён." };
  }

  if (invitation.expiresAt && invitation.expiresAt.getTime() < Date.now()) {
    return { ok: false, message: "Срок действия токена истёк." };
  }

  let profile = invitation.internProfile?.profile ?? null;

  if (!profile && invitation.status !== "PENDING") {
    return { ok: false, message: "Токен уже был активирован." };
  }

  if (profile && invitation.internProfile) {
    const previousAttempt = await prisma.assessmentAttempt.findFirst({
      where: {
        internProfileId: invitation.internProfile.id,
        status: { not: "IN_PROGRESS" },
      },
    });

    if (previousAttempt) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "COMPLETED" },
      });
      return { ok: false, message: "Тест по этому токену уже завершён." };
    }
  }

  if (!profile) {
    const { firstName, lastName } = splitName(invitation.candidateName);
    profile = await prisma.profile.create({
      data: {
        clerkUserId: internSyntheticUserId(invitation.id),
        email: null,
        firstName,
        lastName,
        role: "INTERN",
        internProfile: {
          create: {
            fullName: invitation.candidateName,
            invitationId: invitation.id,
          },
        },
      },
    });

    await prisma.invitation.update({
      where: { id: invitation.id },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
        acceptedByProfileId: profile.id,
      },
    });
  }

  await createInternSession(profile.id);
  revalidatePath("/intern");
  redirect("/intern");
}

export async function logoutInternAction() {
  await clearInternSession();
  redirect("/sign-in/intern");
}

export async function startAttemptAction() {
  const profile = await requireIntern();

  const existing = await prisma.assessmentAttempt.findFirst({
    where: {
      internProfileId: profile.internProfile.id,
    },
    orderBy: { startedAt: "desc" },
  });

  if (existing?.status === "IN_PROGRESS") {
    redirect(`/intern/test?attempt=${existing.id}`);
  }

  if (existing) {
    const ticket = await createResultSession(existing.id);
    await clearInternSession();
    redirect(`/intern/result?ticket=${encodeURIComponent(ticket)}`);
  }

  const questions = await prisma.question.findMany({
    where: { isActive: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { options: true },
  });

  if (questions.length === 0) {
    redirect("/intern");
  }

  const settings = await getSettings();
  const now = new Date();
  const deadlineAt = new Date(
    now.getTime() + settings.totalTimeMinutes * 60 * 1000,
  );

  const attempt = await prisma.assessmentAttempt.create({
    data: {
      internProfileId: profile.internProfile.id,
      startedAt: now,
      deadlineAt,
      questionCount: questions.length,
      answers: {
        create: questions.map((question) => ({
          questionId: question.id,
        })),
      },
      events: {
        create: {
          type: "START",
          occurredAt: now,
          metadata: { questionCount: questions.length },
        },
      },
    },
  });

  redirect(`/intern/test?attempt=${attempt.id}`);
}

export async function selectAnswerAction(input: {
  attemptId: string;
  questionId: string;
  optionId: string;
  timeSpentMs: number;
}) {
  const profile = await requireIntern();
  const attempt = await prisma.assessmentAttempt.findFirst({
    where: {
      id: input.attemptId,
      internProfileId: profile.internProfile.id,
    },
  });

  if (!attempt) return { ok: false, expired: false };

  const checked = await expireAttemptIfNeeded(attempt.id);
  if (!checked || checked.status !== "IN_PROGRESS") {
    return { ok: false, expired: true };
  }

  const option = await prisma.questionOption.findFirst({
    where: {
      id: input.optionId,
      questionId: input.questionId,
    },
  });

  if (!option) return { ok: false, expired: false };

  await prisma.assessmentAnswer.update({
    where: {
      attemptId_questionId: {
        attemptId: input.attemptId,
        questionId: input.questionId,
      },
    },
    data: {
      selectedOptionId: option.id,
      isCorrect: option.isCorrect,
      answeredAt: new Date(),
      timeSpentMs: {
        increment: Math.max(0, Math.round(input.timeSpentMs)),
      },
    },
  });

  await prisma.trackingEvent.create({
    data: {
      attemptId: input.attemptId,
      questionId: input.questionId,
      type: "ANSWER_SELECT",
      elapsedMs: Date.now() - attempt.startedAt.getTime(),
      metadata: { optionId: option.id, isCorrect: option.isCorrect },
    },
  });

  revalidatePath("/intern/test");
  return { ok: true, expired: false };
}

export async function spendQuestionTimeAction(input: {
  attemptId: string;
  questionId: string;
  timeSpentMs: number;
  countVisit?: boolean;
}) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "INTERN" || !profile.internProfile) return;

  const attempt = await prisma.assessmentAttempt.findFirst({
    where: {
      id: input.attemptId,
      internProfileId: profile.internProfile.id,
      status: "IN_PROGRESS",
    },
  });

  if (!attempt) return;

  await prisma.assessmentAnswer.update({
    where: {
      attemptId_questionId: {
        attemptId: input.attemptId,
        questionId: input.questionId,
      },
    },
    data: {
      timeSpentMs: {
        increment: Math.max(0, Math.round(input.timeSpentMs)),
      },
      ...(input.countVisit ? { visits: { increment: 1 } } : {}),
    },
  });
}

export async function submitAttemptAction(input: {
  attemptId: string;
  auto?: boolean;
}) {
  const profile = await requireIntern();
  const attempt = await prisma.assessmentAttempt.findFirst({
    where: {
      id: input.attemptId,
      internProfileId: profile.internProfile.id,
    },
  });

  if (!attempt) {
    redirect("/intern");
  }

  if (attempt.status === "IN_PROGRESS") {
    await prisma.trackingEvent.create({
      data: {
        attemptId: attempt.id,
        type: input.auto ? "TIMER_EXPIRED" : "SUBMIT",
        elapsedMs: Date.now() - attempt.startedAt.getTime(),
      },
    });
  }

  const expired = await expireAttemptIfNeeded(attempt.id);
  if (expired?.status === "IN_PROGRESS") {
    await finalizeAttempt(attempt.id, Boolean(input.auto));
  }

  if (profile.internProfile.invitationId) {
    await prisma.invitation.update({
      where: { id: profile.internProfile.invitationId },
      data: { status: "COMPLETED" },
    });
  }

  const ticket = await createResultSession(attempt.id);
  await clearInternSession();
  revalidatePath("/intern");
  revalidatePath("/admin");
  redirect(`/intern/result?ticket=${encodeURIComponent(ticket)}`);
}

export async function submitApiSandboxAction(input: {
  attemptId: string;
  questionId: string;
  method: string;
  url: string;
  headersText?: string;
  bodyText?: string;
  timeSpentMs: number;
}) {
  const profile = await requireIntern();
  const attempt = await prisma.assessmentAttempt.findFirst({
    where: {
      id: input.attemptId,
      internProfileId: profile.internProfile.id,
    },
  });

  if (!attempt) return { ok: false, expired: false };

  const checked = await expireAttemptIfNeeded(attempt.id);
  if (!checked || checked.status !== "IN_PROGRESS") {
    return { ok: false, expired: true };
  }

  const answer = await prisma.assessmentAnswer.findUnique({
    where: {
      attemptId_questionId: {
        attemptId: input.attemptId,
        questionId: input.questionId,
      },
    },
    include: {
      question: true,
    },
  });

  if (!answer || answer.question.type !== "API_SANDBOX" || !answer.question.apiConfig) {
    return { ok: false, expired: false };
  }

  const evaluation = evaluateApiSandboxRequest(answer.question.apiConfig, {
    method: input.method,
    url: input.url,
    headersText: input.headersText,
    bodyText: input.bodyText,
  });

  await prisma.assessmentAnswer.update({
    where: {
      attemptId_questionId: {
        attemptId: input.attemptId,
        questionId: input.questionId,
      },
    },
    data: {
      apiRequest: evaluation.normalizedRequest,
      apiResponse: evaluation.response,
      isCorrect: evaluation.ok,
      answeredAt: new Date(),
      submissionCount: {
        increment: 1,
      },
      timeSpentMs: {
        increment: Math.max(0, Math.round(input.timeSpentMs)),
      },
    },
  });

  await prisma.trackingEvent.create({
    data: {
      attemptId: input.attemptId,
      questionId: input.questionId,
      type: "API_REQUEST",
      elapsedMs: Date.now() - attempt.startedAt.getTime(),
      metadata: {
        request: evaluation.normalizedRequest,
        response: evaluation.response,
        ok: evaluation.ok,
        errorCode: evaluation.errorCode ?? null,
      },
    },
  });

  revalidatePath("/intern/test");
  return {
    ok: true,
    expired: false,
    correct: evaluation.ok,
    response: evaluation.response,
  };
}

export async function submitDevtoolsAnswerAction(input: {
  attemptId: string;
  questionId: string;
  answerText: string;
  timeSpentMs: number;
}) {
  const profile = await requireIntern();
  const attempt = await prisma.assessmentAttempt.findFirst({
    where: {
      id: input.attemptId,
      internProfileId: profile.internProfile.id,
    },
  });

  if (!attempt) return { ok: false, expired: false };

  const checked = await expireAttemptIfNeeded(attempt.id);
  if (!checked || checked.status !== "IN_PROGRESS") {
    return { ok: false, expired: true };
  }

  const answer = await prisma.assessmentAnswer.findUnique({
    where: {
      attemptId_questionId: {
        attemptId: input.attemptId,
        questionId: input.questionId,
      },
    },
    include: {
      question: true,
    },
  });

  if (
    !answer ||
    answer.question.type !== "DEVTOOLS_SANDBOX" ||
    !answer.question.apiConfig
  ) {
    return { ok: false, expired: false };
  }

  const config = normalizeApiSandboxConfig(answer.question.apiConfig);
  if (config.mode !== "DEVTOOLS_RESPONSE") {
    return { ok: false, expired: false };
  }

  const expectedFromPath = normalizeAnswerValue(
    getJsonPathValue(config.successBody, config.answerPath),
  );
  const expected = normalizeAnswerValue(config.expectedAnswer ?? expectedFromPath);
  const actual = normalizeAnswerValue(input.answerText);
  const isCorrect = actual.toLowerCase() === expected.toLowerCase();

  await prisma.assessmentAnswer.update({
    where: {
      attemptId_questionId: {
        attemptId: input.attemptId,
        questionId: input.questionId,
      },
    },
    data: {
      apiRequest: {
        mode: "DEVTOOLS_RESPONSE",
        answerPath: config.answerPath,
        answerText: input.answerText,
      },
      apiResponse: {
        status: config.successStatus ?? 200,
        headers: config.successHeaders ?? {},
        body: config.successBody ?? { ok: true },
      },
      isCorrect,
      answeredAt: new Date(),
      submissionCount: {
        increment: 1,
      },
      timeSpentMs: {
        increment: Math.max(0, Math.round(input.timeSpentMs)),
      },
    },
  });

  await prisma.trackingEvent.create({
    data: {
      attemptId: input.attemptId,
      questionId: input.questionId,
      type: "ANSWER_SELECT",
      elapsedMs: Date.now() - attempt.startedAt.getTime(),
      metadata: {
        mode: "DEVTOOLS_RESPONSE",
        answerPath: config.answerPath,
        isCorrect,
      },
    },
  });

  revalidatePath("/intern/test");
  return { ok: true, expired: false, correct: isCorrect };
}
