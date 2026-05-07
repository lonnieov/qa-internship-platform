"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  evaluateApiSandboxRequest,
  getJsonPathValue,
  normalizeAnswerValue,
  normalizeApiSandboxConfig,
} from "@/lib/api-sandbox";
import { getInternComment, mergeInternComment } from "@/lib/answer-comment";
import { prisma } from "@/lib/prisma";
import { getCurrentProfile, requireIntern } from "@/lib/auth";
import {
  expireAttemptIfNeeded,
  finalizeAttempt,
  getSettings,
} from "@/lib/assessment";
import { getOpenQuizConfig } from "@/lib/open-quiz";
import {
  getManualQaSandboxConfig,
  normalizeManualQaReports,
  summarizeManualQaAnswer,
} from "@/lib/manual-qa-sandbox";
import {
  getAutotestSandboxConfig,
  summarizeAutotestAnswer,
} from "@/lib/autotest-sandbox";
import {
  getSqlSandboxConfig,
} from "@/lib/sql-sandbox-config";
import { executeSqlSandboxQuery } from "@/lib/sql-sandbox";
import { hashInviteCode } from "@/lib/security";
import {
  clearInternSession,
  createResultSession,
  createInternSession,
} from "@/lib/intern-token-auth";
import { compareQuestionOrder } from "@/lib/question-order";

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

async function findFinishedAttemptForInvitation(
  internProfileId: string,
  invitationCreatedAt: Date,
) {
  return prisma.assessmentAttempt.findFirst({
    where: {
      internProfileId,
      status: { not: "IN_PROGRESS" },
      startedAt: { gte: invitationCreatedAt },
    },
    orderBy: { startedAt: "desc" },
  });
}

export async function loginInternByTokenAction(
  _prevState: InternTokenLoginState,
  formData: FormData,
): Promise<InternTokenLoginState> {
  const token = String(formData.get("token") ?? "");
  const hasPersonalDataConsent =
    String(formData.get("personalDataConsent") ?? "") === "on";

  if (!hasPersonalDataConsent) {
    return {
      ok: false,
      message: "Подтвердите согласие на обработку персональных данных.",
    };
  }

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
    const finishedAttemptForToken = await findFinishedAttemptForInvitation(
      invitation.internProfile.id,
      invitation.createdAt,
    );

    if (finishedAttemptForToken) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "COMPLETED" },
      });

      return { ok: false, message: "Тест по этому токену уже завершён." };
    }

    const activeAttempt = await prisma.assessmentAttempt.findFirst({
      where: {
        internProfileId: invitation.internProfile.id,
        status: "IN_PROGRESS",
      },
    });

    if (activeAttempt) {
      const currentAttempt = await expireAttemptIfNeeded(activeAttempt.id);
      if (!currentAttempt || currentAttempt.status !== "IN_PROGRESS") {
        return { ok: false, message: "Тест по этому токену уже завершён." };
      }

      await createInternSession(profile.id);
      revalidatePath("/intern");
      redirect("/intern");
    }

    if (invitation.status === "PENDING") {
      if (
        invitation.acceptedByProfileId &&
        invitation.acceptedByProfileId !== profile.id
      ) {
        return { ok: false, message: "Токен уже привязан к другому профилю." };
      }

      await prisma.$transaction([
        prisma.invitation.update({
          where: { id: invitation.id },
          data: {
            status: "ACCEPTED",
            acceptedAt: new Date(),
            acceptedByProfileId: profile.id,
          },
        }),
        prisma.internProfile.update({
          where: { id: invitation.internProfile.id },
          data: {
            trackId: invitation.internProfile.trackId ?? invitation.trackId,
            waveId: invitation.internProfile.waveId ?? invitation.waveId,
          },
        }),
      ]);
    }
  }

  if (!profile) {
    const { firstName, lastName } = splitName(invitation.candidateName);
    profile = await prisma.profile.create({
      data: {
        email: null,
        firstName,
        lastName,
        role: "INTERN",
        internProfile: {
          create: {
            fullName: invitation.candidateName,
            invitationId: invitation.id,
            trackId: invitation.trackId,
            waveId: invitation.waveId,
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

  const currentExisting =
    existing?.status === "IN_PROGRESS"
      ? await expireAttemptIfNeeded(existing.id)
      : existing;

  const invitation = profile.internProfile.invitationId
    ? await prisma.invitation.findUnique({
        where: { id: profile.internProfile.invitationId },
      })
    : null;

  if (invitation) {
    const finishedAttemptForToken = await findFinishedAttemptForInvitation(
      profile.internProfile.id,
      invitation.createdAt,
    );

    if (finishedAttemptForToken) {
      if (invitation.status !== "COMPLETED") {
        await prisma.invitation.update({
          where: { id: invitation.id },
          data: { status: "COMPLETED" },
        });
      }

      const ticket = await createResultSession(finishedAttemptForToken.id);
      await clearInternSession();
      redirect(`/intern/result?ticket=${encodeURIComponent(ticket)}`);
    }
  }

  if (currentExisting?.status === "IN_PROGRESS") {
    redirect(`/intern/test?attempt=${currentExisting.id}`);
  }

  if (currentExisting && invitation?.status === "COMPLETED") {
    const ticket = await createResultSession(currentExisting.id);
    await clearInternSession();
    redirect(`/intern/result?ticket=${encodeURIComponent(ticket)}`);
  }

  const questions = await prisma.question.findMany({
    where: {
      isActive: true,
      ...(profile.internProfile.trackId
        ? { trackId: profile.internProfile.trackId }
        : {}),
    },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { options: true },
  });
  questions.sort(compareQuestionOrder);

  if (questions.length === 0) {
    redirect("/intern");
  }

  const settings = await getSettings({
    trackId: profile.internProfile.trackId,
    waveId: profile.internProfile.waveId,
  });
  const now = new Date();
  const deadlineAt = new Date(
    now.getTime() + settings.totalTimeMinutes * 60 * 1000,
  );

  const attempt = await prisma.assessmentAttempt.create({
    data: {
      internProfileId: profile.internProfile.id,
      trackId: profile.internProfile.trackId,
      waveId: profile.internProfile.waveId,
      startedAt: now,
      deadlineAt,
      questionCount: questions.length,
      answers: {
        create: questions.map((question) => ({
          questionId: question.id,
        })),
      },
    },
  });

  redirect(`/intern/test?attempt=${attempt.id}`);
}

export async function submitOpenQuizAnswerAction(input: {
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

  if (!answer || answer.question.type !== "QUIZ") {
    return { ok: false, expired: false };
  }

  const config = getOpenQuizConfig(answer.question.apiConfig);
  if (!config) {
    return { ok: false, expired: false };
  }

  await prisma.assessmentAnswer.update({
    where: {
      attemptId_questionId: {
        attemptId: input.attemptId,
        questionId: input.questionId,
      },
    },
    data: {
      apiRequest: mergeInternComment(
        {
          mode: "OPEN_TEXT",
          answerText: input.answerText,
        },
        getInternComment(answer.apiRequest),
      ),
      selectedOptionId: null,
      isCorrect: false,
      answeredAt: new Date(),
      submissionCount: {
        increment: 1,
      },
      timeSpentMs: {
        increment: Math.max(0, Math.round(input.timeSpentMs)),
      },
    },
  });

  revalidatePath("/intern/test");
  return { ok: true, expired: false };
}

export async function saveQuestionCommentAction(input: {
  attemptId: string;
  questionId: string;
  internComment: string;
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
  });

  if (!answer) return { ok: false, expired: false };

  await prisma.assessmentAnswer.update({
    where: {
      attemptId_questionId: {
        attemptId: input.attemptId,
        questionId: input.questionId,
      },
    },
    data: {
      apiRequest: mergeInternComment(answer.apiRequest, input.internComment),
    },
  });

  revalidatePath("/intern/test");
  return { ok: true, expired: false };
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

  if (
    !answer ||
    answer.question.type !== "API_SANDBOX" ||
    !answer.question.apiConfig
  ) {
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
      apiRequest: mergeInternComment(
        evaluation.normalizedRequest,
        getInternComment(answer.apiRequest),
      ),
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

  revalidatePath("/intern/test");
  return {
    ok: true,
    expired: false,
    correct: evaluation.ok,
    response: evaluation.response,
  };
}

export async function submitSqlSandboxAction(input: {
  attemptId: string;
  questionId: string;
  query: string;
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
    answer.question.type !== "SQL_SANDBOX" ||
    !answer.question.apiConfig
  ) {
    return { ok: false, expired: false };
  }

  const config = getSqlSandboxConfig(answer.question.apiConfig);
  if (!config) {
    return { ok: false, expired: false };
  }

  const response = await executeSqlSandboxQuery(config, input.query);

  await prisma.assessmentAnswer.update({
    where: {
      attemptId_questionId: {
        attemptId: input.attemptId,
        questionId: input.questionId,
      },
    },
    data: {
      apiRequest: mergeInternComment(
        {
          mode: "SQL_SANDBOX",
          query: input.query,
        },
        getInternComment(answer.apiRequest),
      ),
      apiResponse: response,
      isCorrect: response.ok,
      answeredAt: new Date(),
      submissionCount: {
        increment: 1,
      },
      timeSpentMs: {
        increment: Math.max(0, Math.round(input.timeSpentMs)),
      },
    },
  });

  revalidatePath("/intern/test");
  return {
    ok: true,
    expired: false,
    correct: response.ok,
    response,
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
  const expected = normalizeAnswerValue(
    config.expectedAnswer ?? expectedFromPath,
  );
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
      apiRequest: mergeInternComment(
        {
          mode: "DEVTOOLS_RESPONSE",
          answerPath: config.answerPath,
          answerText: input.answerText,
        },
        getInternComment(answer.apiRequest),
      ),
      apiResponse: {
        status: config.successStatus ?? 200,
        headers: config.successHeaders ?? {},
        body: config.successBody ?? { ok: true },
      },
      isCorrect,
      answeredAt: new Date(),
      submissionCount: input.answerText.trim()
        ? Math.max(1, answer.submissionCount)
        : 0,
      timeSpentMs: {
        increment: Math.max(0, Math.round(input.timeSpentMs)),
      },
    },
  });

  revalidatePath("/intern/test");
  return { ok: true, expired: false };
}

export async function submitAutotestAnswerAction(input: {
  attemptId: string;
  questionId: string;
  code: string;
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
    include: { question: true },
  });

  if (
    !answer ||
    answer.question.type !== "AUTOTEST_SANDBOX" ||
    !answer.question.apiConfig
  ) {
    return { ok: false, expired: false };
  }

  const config = getAutotestSandboxConfig(answer.question.apiConfig);
  const summary = summarizeAutotestAnswer(input.code, config);
  const hasAnswer = input.code.trim().length > 0;

  await prisma.assessmentAnswer.update({
    where: {
      attemptId_questionId: {
        attemptId: input.attemptId,
        questionId: input.questionId,
      },
    },
    data: {
      apiRequest: mergeInternComment(
        {
          mode: "AUTOTEST_SANDBOX",
          code: input.code,
        },
        getInternComment(answer.apiRequest),
      ),
      apiResponse: summary,
      isCorrect: false,
      answeredAt: hasAnswer ? new Date() : null,
      submissionCount: hasAnswer ? Math.max(1, answer.submissionCount) : 0,
      timeSpentMs: {
        increment: Math.max(0, Math.round(input.timeSpentMs)),
      },
    },
  });

  revalidatePath("/intern/test");
  return { ok: true, expired: false, summary };
}

export async function submitManualQaAnswerAction(input: {
  attemptId: string;
  questionId: string;
  reports: unknown;
  noBugsFound: boolean;
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
    answer.question.type !== "MANUAL_QA_SANDBOX" ||
    !answer.question.apiConfig
  ) {
    return { ok: false, expired: false };
  }

  const config = getManualQaSandboxConfig(answer.question.apiConfig);
  const reports = normalizeManualQaReports(input.reports);
  const noBugsFound = input.noBugsFound && reports.length === 0;
  const summary = summarizeManualQaAnswer(reports, config);
  const hasAnswer = reports.length > 0 || noBugsFound;

  await prisma.assessmentAnswer.update({
    where: {
      attemptId_questionId: {
        attemptId: input.attemptId,
        questionId: input.questionId,
      },
    },
    data: {
      apiRequest: mergeInternComment(
        {
          mode: "MANUAL_QA_SANDBOX",
          reports,
          noBugsFound,
        },
        getInternComment(answer.apiRequest),
      ),
      apiResponse: summary,
      isCorrect: false,
      answeredAt: hasAnswer ? new Date() : null,
      submissionCount: hasAnswer ? Math.max(1, answer.submissionCount) : 0,
      timeSpentMs: {
        increment: Math.max(0, Math.round(input.timeSpentMs)),
      },
    },
  });

  revalidatePath("/intern/test");
  return { ok: true, expired: false, summary };
}
