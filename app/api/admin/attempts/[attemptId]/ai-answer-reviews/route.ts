import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import {
  generateGroqAnswerReview,
  getAiAnswerReview,
  isAiReviewableAnswer,
} from "@/lib/ai-answer-review";
import { getCurrentProfile, getManageableTrackIds } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function responseRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  const profile = await getCurrentProfile();

  if (!profile || (profile.role !== "ADMIN" && profile.role !== "TRACK_MASTER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "GROQ_API_KEY не задан. AI-проверка отключена." },
      { status: 503 },
    );
  }

  const { attemptId } = await params;
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      answers: {
        include: {
          question: {
            select: {
              type: true,
              text: true,
              explanation: true,
              apiConfig: true,
            },
          },
        },
      },
    },
  });

  if (!attempt) {
    return NextResponse.json({ error: "Попытка не найдена." }, { status: 404 });
  }

  const manageableTrackIds = await getManageableTrackIds(profile);
  if (
    manageableTrackIds &&
    (!attempt.trackId || !manageableTrackIds.includes(attempt.trackId))
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const reviewableAnswers = attempt.answers.filter(isAiReviewableAnswer);
  const missingAnswers = reviewableAnswers.filter(
    (answer) => !getAiAnswerReview(answer.apiResponse),
  );
  const generated = [];

  for (const answer of missingAnswers) {
    const aiReview = await generateGroqAnswerReview(answer);
    const nextResponse = {
      ...responseRecord(answer.apiResponse),
      aiReview,
    } as Prisma.InputJsonObject;

    await prisma.assessmentAnswer.update({
      where: { id: answer.id },
      data: { apiResponse: nextResponse },
    });

    generated.push({ answerId: answer.id, aiReview });
  }

  return NextResponse.json({
    ok: true,
    generatedCount: generated.length,
    generated,
  });
}
