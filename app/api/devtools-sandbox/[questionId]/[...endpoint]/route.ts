import { NextResponse } from "next/server";
import { normalizeApiSandboxConfig } from "@/lib/api-sandbox";
import { getCurrentProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

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

  if (config.mode !== "DEVTOOLS_RESPONSE" || actualEndpoint !== expectedEndpoint) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (request.method !== config.method.toUpperCase()) {
    return NextResponse.json(
      { error: "method_not_allowed", expectedMethod: config.method.toUpperCase() },
      { status: 405 },
    );
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
