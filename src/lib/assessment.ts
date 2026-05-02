import { prisma } from "@/lib/prisma";
import { getOpenQuizConfig } from "@/lib/open-quiz";

export async function getSettings() {
  return prisma.assessmentSettings.upsert({
    where: { id: "global" },
    update: {},
    create: {
      id: "global",
      totalTimeMinutes: 30,
    },
  });
}

export async function calculateAttemptScore(attemptId: string) {
  const answers = await prisma.assessmentAnswer.findMany({
    where: { attemptId },
    include: {
      question: {
        select: {
          type: true,
          apiConfig: true,
        },
      },
    },
  });
  const scoredAnswers = answers.filter((answer) => {
    if (answer.question.type === "MANUAL_QA_SANDBOX") {
      return false;
    }

    if (answer.question.type !== "QUIZ") {
      return true;
    }

    return !getOpenQuizConfig(answer.question.apiConfig);
  });

  const questionCount = scoredAnswers.length;
  const correctCount = scoredAnswers.filter((answer) => answer.isCorrect).length;
  const scorePercent =
    questionCount === 0 ? 0 : (correctCount / questionCount) * 100;

  return {
    questionCount,
    correctCount,
    scorePercent,
  };
}

export async function finalizeAttempt(attemptId: string, auto = false) {
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
  });

  if (!attempt || attempt.status !== "IN_PROGRESS") {
    return attempt;
  }

  const score = await calculateAttemptScore(attemptId);
  const now = new Date();

  return prisma.assessmentAttempt.update({
    where: { id: attemptId },
    data: {
      status: auto ? "AUTO_SUBMITTED" : "SUBMITTED",
      submittedAt: now,
      totalTimeSeconds: Math.max(
        0,
        Math.round((now.getTime() - attempt.startedAt.getTime()) / 1000),
      ),
      ...score,
    },
  });
}

export async function expireAttemptIfNeeded(attemptId: string) {
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      internProfile: {
        select: {
          invitationId: true,
        },
      },
    },
  });

  if (!attempt || attempt.status !== "IN_PROGRESS") return attempt;

  if (attempt.deadlineAt.getTime() <= Date.now()) {
    const score = await calculateAttemptScore(attemptId);
    const expiredAttempt = await prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        status: "EXPIRED",
        submittedAt: new Date(),
        totalTimeSeconds: Math.max(
          0,
          Math.round(
            (attempt.deadlineAt.getTime() - attempt.startedAt.getTime()) / 1000,
          ),
        ),
        ...score,
      },
    });

    if (attempt.internProfile.invitationId) {
      await prisma.invitation.update({
        where: { id: attempt.internProfile.invitationId },
        data: { status: "COMPLETED" },
      });
    }

    return expiredAttempt;
  }

  return attempt;
}
