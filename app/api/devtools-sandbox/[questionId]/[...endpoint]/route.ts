import { NextResponse } from "next/server";
import {
  normalizeApiSandboxConfig,
  type ApiSandboxConfig,
} from "@/lib/api-sandbox";
import { getCurrentProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function queryWithoutAttempt(searchParams: URLSearchParams) {
  const query: Record<string, string> = {};

  searchParams.forEach((value, key) => {
    if (key !== "attempt") {
      query[key] = value;
    }
  });

  return query;
}

function equalQuery(
  actual: Record<string, string>,
  expected: Record<string, string>,
) {
  const actualEntries = Object.entries(actual).sort(([left], [right]) =>
    left.localeCompare(right),
  );
  const expectedEntries = Object.entries(expected).sort(([left], [right]) =>
    left.localeCompare(right),
  );

  return JSON.stringify(actualEntries) === JSON.stringify(expectedEntries);
}

function hashText(value: string) {
  let hash = 0;

  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return hash;
}

function buildNoiseBody(
  questionId: string,
  endpoint: string,
  query: Record<string, string>,
) {
  const seed = hashText(`${questionId}:${endpoint}:${JSON.stringify(query)}`);
  const messages = [
    "queued for validation",
    "session state refreshed",
    "request accepted",
    "preview data prepared",
    "background sync complete",
  ];
  const statuses = ["ok", "accepted", "processed", "ready", "synced"];
  const code = (seed % 9000) + 1000;

  return {
    status: statuses[seed % statuses.length],
    message: messages[seed % messages.length],
    data: {
      id: `tmp_${code}`,
      value: `check_${code}`,
      reference: endpoint || "root",
    },
    meta: {
      requestId: `req_${questionId.slice(0, 6)}_${code}`,
      query,
    },
  };
}

function buildNoiseResponse(
  config: ApiSandboxConfig,
  questionId: string,
  endpoint: string,
  query: Record<string, string>,
) {
  const response = NextResponse.json(buildNoiseBody(questionId, endpoint, query), {
    status: config.successStatus ?? 200,
  });

  for (const [key, value] of Object.entries(config.successHeaders ?? {})) {
    response.headers.set(key, value);
  }

  response.headers.set("Cache-Control", "no-store");
  return response;
}

async function handleRequest(
  request: Request,
  context: { params: Promise<{ questionId: string; endpoint: string[] }> },
) {
  const profile = await getCurrentProfile();
  const { questionId, endpoint } = await context.params;
  const url = new URL(request.url);
  const attemptId = url.searchParams.get("attempt");

  if (!profile || profile.role !== "INTERN" || !profile.internProfile || !attemptId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const attempt = await prisma.assessmentAttempt.findFirst({
    where: {
      id: attemptId,
      internProfileId: profile.internProfile.id,
      status: "IN_PROGRESS",
    },
  });

  if (!attempt) {
    return NextResponse.json({ error: "attempt_not_active" }, { status: 409 });
  }

  const question = await prisma.question.findFirst({
    where: {
      id: questionId,
      type: "DEVTOOLS_SANDBOX",
      isActive: true,
    },
  });

  if (!question?.apiConfig) {
    return NextResponse.json({ error: "question_not_found" }, { status: 404 });
  }

  const config = normalizeApiSandboxConfig(question.apiConfig);
  const expectedEndpoint = config.path.replace(/^\/+/, "");
  const actualEndpoint = endpoint.join("/");
  const actualQuery = queryWithoutAttempt(url.searchParams);
  const expectedQuery = config.query ?? {};

  if (config.mode !== "DEVTOOLS_RESPONSE") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (request.method !== config.method.toUpperCase()) {
    return NextResponse.json(
      { error: "method_not_allowed", expectedMethod: config.method.toUpperCase() },
      { status: 405 },
    );
  }

  if (
    actualEndpoint !== expectedEndpoint ||
    !equalQuery(actualQuery, expectedQuery)
  ) {
    return buildNoiseResponse(config, questionId, actualEndpoint, actualQuery);
  }

  const response = NextResponse.json(config.successBody ?? { ok: true }, {
    status: config.successStatus ?? 200,
  });

  for (const [key, value] of Object.entries(config.successHeaders ?? {})) {
    response.headers.set(key, value);
  }

  return response;
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
