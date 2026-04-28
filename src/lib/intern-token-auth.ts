import crypto from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const cookieName = "qa_intern";
const resultCookieName = "qa_result";
const sessionTtlMs = 1000 * 60 * 60 * 24 * 14;
const resultSessionTtlMs = 1000 * 60 * 30;

function sessionSecret() {
  return (
    process.env.INTERN_SESSION_SECRET ||
    process.env.DEMO_ADMIN_SESSION_SECRET ||
    process.env.CLERK_SECRET_KEY ||
    "local-intern-session-secret"
  );
}

function sign(payload: string) {
  return crypto.createHmac("sha256", sessionSecret()).update(payload).digest("hex");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export async function createInternSession(profileId: string) {
  const expiresAt = Date.now() + sessionTtlMs;
  const payload = Buffer.from(
    JSON.stringify({ sub: profileId, role: "INTERN", exp: expiresAt }),
  ).toString("base64url");
  const token = `${payload}.${sign(payload)}`;
  const store = await cookies();

  store.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.round(sessionTtlMs / 1000),
  });
}

export async function clearInternSession() {
  const store = await cookies();
  store.delete(cookieName);
}

export async function createResultSession(attemptId: string) {
  const token = createResultTicket(attemptId);
  const store = await cookies();

  store.set(resultCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/intern/result",
    maxAge: Math.round(resultSessionTtlMs / 1000),
  });

  return token;
}

export function createResultTicket(attemptId: string) {
  const expiresAt = Date.now() + resultSessionTtlMs;
  const payload = Buffer.from(
    JSON.stringify({ sub: attemptId, type: "RESULT", exp: expiresAt }),
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

export function verifyResultTicket(token: string | null | undefined) {
  if (!token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(sign(payload), signature)) {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (data.type !== "RESULT" || data.exp <= Date.now()) return null;
    return String(data.sub);
  } catch {
    return null;
  }
}

export async function getResultAttemptId() {
  const store = await cookies();
  return verifyResultTicket(store.get(resultCookieName)?.value);
}

export async function getInternSessionProfile() {
  const store = await cookies();
  const token = store.get(cookieName)?.value;
  if (!token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(sign(payload), signature)) {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (data.role !== "INTERN" || data.exp <= Date.now()) return null;

    const profile = await prisma.profile.findUnique({
      where: { id: data.sub },
      include: {
        internProfile: {
          include: { invitation: true },
        },
      },
    });

    if (!profile?.internProfile) return null;
    if (profile.internProfile.invitation?.status !== "ACCEPTED") return null;

    return profile;
  } catch {
    return null;
  }
}

export function internSyntheticUserId(invitationId: string) {
  return `intern:${invitationId}`;
}
