import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { TrackingEventType } from "@/generated/prisma/enums";

export const runtime = "nodejs";

const allowedTypes = new Set<TrackingEventType>([
  "MOUSE_MOVE",
  "CLICK",
  "KEYDOWN",
  "VISIBILITY_CHANGE",
  "FOCUS",
  "BLUR",
  "NAVIGATION",
]);

export async function POST(request: Request) {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "INTERN" || !profile.internProfile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const type = String(body.type ?? "") as TrackingEventType;
  const attemptId = String(body.attemptId ?? "");
  const questionId = body.questionId ? String(body.questionId) : null;

  if (!allowedTypes.has(type) || !attemptId) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  const attempt = await prisma.assessmentAttempt.findFirst({
    where: {
      id: attemptId,
      internProfileId: profile.internProfile.id,
      status: "IN_PROGRESS",
    },
  });

  if (!attempt) {
    return NextResponse.json({ error: "Attempt is not active" }, { status: 409 });
  }

  await prisma.trackingEvent.create({
    data: {
      attemptId,
      questionId,
      type,
      x: Number.isFinite(body.x) ? Math.round(body.x) : null,
      y: Number.isFinite(body.y) ? Math.round(body.y) : null,
      target: body.target ? String(body.target).slice(0, 160) : null,
      elapsedMs: Number.isFinite(body.elapsedMs) ? Math.round(body.elapsedMs) : null,
      metadata: body.metadata ?? undefined,
    },
  });

  return NextResponse.json({ ok: true });
}
