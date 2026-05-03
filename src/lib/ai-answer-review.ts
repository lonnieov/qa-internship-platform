import type { Prisma } from "@/generated/prisma/client";
import { stringifyPrettyJson } from "@/lib/api-sandbox";
import {
  getAutotestAnswerPayload,
  getAutotestSandboxConfig,
} from "@/lib/autotest-sandbox";
import { getGroqClient, getGroqModel } from "@/lib/groq-client";
import {
  getManualQaAnswerPayload,
  getManualQaSandboxConfig,
} from "@/lib/manual-qa-sandbox";
import { getOpenQuizConfig } from "@/lib/open-quiz";

export type AiAnswerReview = {
  provider: "groq";
  model: string;
  verdict: "pass" | "fail" | "needs_review";
  score: number;
  summary: string;
  strengths: string[];
  issues: string[];
  recommendation: string;
  generatedAt: string;
};

type AiReviewableAnswer = {
  id: string;
  apiRequest: Prisma.JsonValue | null;
  apiResponse: Prisma.JsonValue | null;
  question: {
    type: string;
    text: string;
    explanation: string | null;
    apiConfig: Prisma.JsonValue | null;
  };
};

const aiAnswerReviewPrompt = `Ты senior QA reviewer.
Оцени один ответ стажёра по заданию.
Опирайся только на предоставленное ТЗ, рубрику, эталонный ответ и ответ стажёра.
Не выдумывай факты. Если данных недостаточно, верни verdict "needs_review".
Ответ верни только валидным JSON без markdown:
{
  "verdict": "pass" | "fail" | "needs_review",
  "score": 0,
  "summary": "короткая оценка",
  "strengths": ["..."],
  "issues": ["..."],
  "recommendation": "что должен сделать админ или что уточнить"
}`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value
        .map((item) => String(item))
        .filter(Boolean)
        .slice(0, 8)
    : [];
}

function clampScore(value: unknown) {
  const score = Number(value);
  if (!Number.isFinite(score)) return 0;
  return Math.min(100, Math.max(0, Math.round(score)));
}

function normalizeAiReview(
  value: unknown,
  model: string,
  fallback = "",
): AiAnswerReview {
  const data = isRecord(value) ? value : {};
  const verdict =
    data.verdict === "pass" ||
    data.verdict === "fail" ||
    data.verdict === "needs_review"
      ? data.verdict
      : "needs_review";

  return {
    provider: "groq",
    model,
    verdict,
    score: clampScore(data.score),
    summary: String(data.summary ?? fallback)
      .trim()
      .slice(0, 1200),
    strengths: stringArray(data.strengths),
    issues: stringArray(data.issues),
    recommendation: String(data.recommendation ?? "")
      .trim()
      .slice(0, 1200),
    generatedAt: String(data.generatedAt ?? new Date().toISOString()),
  };
}

function parseJsonObject(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new Error("AI response is not JSON.");
  }
}

export function getAiAnswerReview(value: unknown): AiAnswerReview | null {
  if (!isRecord(value) || !isRecord(value.aiReview)) return null;

  const review = value.aiReview;
  if (review.provider !== "groq") return null;

  return normalizeAiReview(review, String(review.model ?? getGroqModel()));
}

export function isAiReviewableAnswer(answer: AiReviewableAnswer) {
  return (
    Boolean(getOpenQuizConfig(answer.question.apiConfig)) ||
    answer.question.type === "MANUAL_QA_SANDBOX" ||
    answer.question.type === "AUTOTEST_SANDBOX"
  );
}

function buildOpenQuizContext(answer: AiReviewableAnswer) {
  const config = getOpenQuizConfig(answer.question.apiConfig);
  const answerText = isRecord(answer.apiRequest)
    ? String(answer.apiRequest.answerText ?? "")
    : "";

  return {
    type: "OPEN_QUIZ",
    task: answer.question.text,
    adminExplanation: answer.question.explanation,
    expectedAnswer: config?.expectedAnswer ?? null,
    answerLabel: config?.answerLabel ?? null,
    internAnswer: answerText,
  };
}

function buildManualQaContext(answer: AiReviewableAnswer) {
  const config = getManualQaSandboxConfig(answer.question.apiConfig);
  const payload = getManualQaAnswerPayload(answer.apiRequest);

  return {
    type: "MANUAL_QA_SANDBOX",
    task: answer.question.text,
    adminExplanation: answer.question.explanation,
    mission: config?.mission ?? null,
    scenarioTitle: config?.scenarioTitle ?? null,
    knownBugsRubric: config?.knownBugs ?? [],
    bugCategories: config?.bugCategories ?? [],
    internAnswer: payload ?? null,
    storedSummary: answer.apiResponse,
  };
}

function buildAutotestContext(answer: AiReviewableAnswer) {
  const config = getAutotestSandboxConfig(answer.question.apiConfig);
  const payload = getAutotestAnswerPayload(answer.apiRequest);

  return {
    type: "AUTOTEST_SANDBOX",
    task: answer.question.text,
    adminExplanation: answer.question.explanation,
    mission: config?.mission ?? null,
    scenarioTitle: config?.scenarioTitle ?? null,
    availableMethods: config?.availableMethods ?? [],
    expectedScenarios: config?.expectedScenarios ?? [],
    exampleCode: config?.exampleCode ?? null,
    internAnswer: payload ?? null,
    storedSummary: answer.apiResponse,
  };
}

function buildReviewContext(answer: AiReviewableAnswer) {
  if (getOpenQuizConfig(answer.question.apiConfig)) {
    return buildOpenQuizContext(answer);
  }

  if (answer.question.type === "MANUAL_QA_SANDBOX") {
    return buildManualQaContext(answer);
  }

  return buildAutotestContext(answer);
}

export async function generateGroqAnswerReview(answer: AiReviewableAnswer) {
  const model = getGroqModel();
  const client = getGroqClient();
  const context = buildReviewContext(answer);
  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: aiAnswerReviewPrompt,
      },
      {
        role: "user",
        content: stringifyPrettyJson(context),
      },
    ],
    temperature: 0.1,
    max_completion_tokens: 1000,
    response_format: { type: "json_object" },
    stream: false,
  });
  const text = completion.choices[0]?.message.content ?? "";

  try {
    return normalizeAiReview(parseJsonObject(text), model);
  } catch {
    return normalizeAiReview(
      {
        verdict: "needs_review",
        score: 0,
        summary: text || "Groq не вернул валидный JSON.",
        strengths: [],
        issues: ["Ответ нейросети не удалось разобрать как JSON."],
        recommendation: "Проверьте ответ вручную.",
      },
      model,
      text,
    );
  }
}
