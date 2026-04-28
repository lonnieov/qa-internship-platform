import { redirect } from "next/navigation";
import { expireAttemptIfNeeded } from "@/lib/assessment";
import { requireIntern } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  const questions = attempt.answers.map((answer) => ({
    id: answer.question.id,
    text: answer.question.text,
    selectedOptionId: answer.selectedOptionId,
    timeSpentMs: answer.timeSpentMs,
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
      startedAt={attempt.startedAt.toISOString()}
      deadlineAt={attempt.deadlineAt.toISOString()}
      questions={questions}
    />
  );
}
