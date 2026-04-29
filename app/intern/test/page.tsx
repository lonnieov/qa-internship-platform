import { redirect } from "next/navigation";
import { expireAttemptIfNeeded } from "@/lib/assessment";
import { requireIntern } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { compareQuestionOrder } from "@/lib/question-order";
import { TestRunner } from "@/components/intern/test-runner";

export default async function InternTestPage({
  searchParams,
}: {
  searchParams: Promise<{ attempt?: string }>;
}) {
  const profile = await requireIntern();
  const { attempt: attemptId } = await searchParams;

  const attempt = await prisma.assessmentAttempt.findFirst({
    where: {
      id: attemptId,
      internProfileId: profile.internProfile.id,
    },
    include: {
      answers: {
        include: {
          question: {
            include: { options: { orderBy: { order: "asc" } } },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!attempt) {
    const active = await prisma.assessmentAttempt.findFirst({
      where: {
        internProfileId: profile.internProfile.id,
        status: "IN_PROGRESS",
      },
      orderBy: { startedAt: "desc" },
    });
    redirect(active ? `/intern/test?attempt=${active.id}` : "/intern");
  }

  const checked = await expireAttemptIfNeeded(attempt.id);
  if (!checked || checked.status !== "IN_PROGRESS") {
    redirect(`/intern/finish?attempt=${attempt.id}`);
  }

  const questions = [...attempt.answers]
    .sort((left, right) =>
      compareQuestionOrder(
        {
          type: left.question.type,
          order: left.question.order,
          createdAt: left.question.createdAt,
        },
        {
          type: right.question.type,
          order: right.question.order,
          createdAt: right.question.createdAt,
        },
      ),
    )
    .map((answer) => ({
      id: answer.question.id,
      type: answer.question.type,
      track: answer.question.track,
      text: answer.question.text,
      explanation: answer.question.explanation,
      selectedOptionId: answer.selectedOptionId,
      timeSpentMs: answer.timeSpentMs,
      submissionCount: answer.submissionCount,
      apiConfig: answer.question.apiConfig,
      apiRequest: answer.apiRequest,
      apiResponse: answer.apiResponse,
      isCorrect: answer.isCorrect,
      options: answer.question.options.map((option) => ({
        id: option.id,
        label: option.label,
        text: option.text,
        order: option.order,
      })),
    }));

  return (
    <TestRunner
      attemptId={attempt.id}
      deadlineAt={attempt.deadlineAt.toISOString()}
      questions={questions}
    />
  );
}
