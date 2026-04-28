import { prisma } from "@/lib/prisma";

export async function getSettings() {
  return prisma.assessmentSettings.upsert({
    where: { id: "global" },
    update: {},
    create: {
      id: "global",
      totalTimeMinutes: 30,
      passingScore: 100,
    },
  });
}

export async function calculateAttemptScore(attemptId: string) {
  const answers = await prisma.assessmentAnswer.findMany({
    where: { attemptId },
  });

  const questionCount = answers.length;
  const correctCount = answers.filter((answer) => answer.isCorrect).length;
  const scorePercent = questionCount === 0 ? 0 : (correctCount / questionCount) * 100;

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
  });

  if (!attempt || attempt.status !== "IN_PROGRESS") return attempt;

  if (attempt.deadlineAt.getTime() <= Date.now()) {
    const score = await calculateAttemptScore(attemptId);
    return prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        status: "EXPIRED",
        submittedAt: new Date(),
        totalTimeSeconds: Math.max(
          0,
          Math.round((attempt.deadlineAt.getTime() - attempt.startedAt.getTime()) / 1000),
        ),
        ...score,
      },
    });
  }

  return attempt;
}
