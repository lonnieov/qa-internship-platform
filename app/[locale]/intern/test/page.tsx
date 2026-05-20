import { redirect } from "next/navigation";
import { getInternComment } from "@/lib/answer-comment";
import { expireAttemptIfNeeded } from "@/lib/assessment";
import { requireIntern } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { compareQuestionOrder } from "@/lib/question-order";
import { TestRunner } from "@/components/intern/test-runner";

function localizedText(locale: string, ru: string, uz?: string | null) {
  return locale === "uz" && uz?.trim() ? uz : ru;
}

function localizeApiConfig(config: unknown, locale: string) {
  if (
    locale !== "uz" ||
    !config ||
    typeof config !== "object" ||
    Array.isArray(config)
  ) {
    return config;
  }

  const missionUz = (config as { missionUz?: unknown }).missionUz;
  if (typeof missionUz !== "string" || !missionUz.trim()) {
    return config;
  }

  return {
    ...config,
    mission: missionUz,
  };
}

export default async function InternTestPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ attempt?: string }>;
}) {
  const { locale } = await params;
  const profile = await requireIntern({ locale });
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
            include: {
              trackRef: true,
              options: { orderBy: { order: "asc" } },
            },
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
    redirect(
      active
        ? `/${locale}/intern/test?attempt=${active.id}`
        : `/${locale}/intern`,
    );
  }

  const checked = await expireAttemptIfNeeded(attempt.id);
  if (!checked || checked.status !== "IN_PROGRESS") {
    redirect(`/${locale}/intern/finish?attempt=${attempt.id}`);
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
      track: answer.question.trackRef?.name ?? answer.question.track,
      text: localizedText(locale, answer.question.text, answer.question.textUz),
      explanation: answer.question.explanation,
      selectedOptionId: answer.selectedOptionId,
      textAnswer:
        answer.apiRequest &&
        typeof answer.apiRequest === "object" &&
        !Array.isArray(answer.apiRequest) &&
        "answerText" in answer.apiRequest
          ? String(
              (
                answer.apiRequest as {
                  answerText?: unknown;
                }
              ).answerText ?? "",
            )
          : "",
      timeSpentMs: answer.timeSpentMs,
      submissionCount: answer.submissionCount,
      apiConfig: localizeApiConfig(answer.question.apiConfig, locale),
      apiRequest: answer.apiRequest,
      apiResponse: answer.apiResponse,
      isCorrect: answer.isCorrect,
      internComment: getInternComment(answer.apiRequest),
      options: answer.question.options.map((option) => ({
        id: option.id,
        label: option.label,
        text: localizedText(locale, option.text, option.textUz),
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
