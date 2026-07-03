import crypto from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireSecret } from "@/lib/env";

const cookieName = "qa_admin";
const sessionTtlMs = 1000 * 60 * 60 * 12;
const passwordIterations = 310000;

function sessionSecret() {
  // Dev fallback intentionally matches the historical value so existing local
  // sessions keep working. In production requireSecret throws instead, so this
  // publicly-known string is never used to sign real tokens.
  return requireSecret("ADMIN_SESSION_SECRET", "local-admin-session-secret");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function hashSessionToken(token: string) {
  return crypto
    .createHmac("sha256", sessionSecret())
    .update(token)
    .digest("hex");
}

export const MIN_PASSWORD_LENGTH = 10;

/**
 * Returns a Russian-language error message when the password is too weak, or
 * null when it is acceptable. Used everywhere a password is set so the policy
 * stays consistent across admin, self-service and track-master flows.
 */
export function passwordPolicyError(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Пароль должен быть не короче ${MIN_PASSWORD_LENGTH} символов.`;
  }
  if (!/[a-zA-Zа-яА-Я]/.test(password) || !/[0-9]/.test(password)) {
    return "Пароль должен содержать буквы и цифры.";
  }
  return null;
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, passwordIterations, 32, "sha256")
    .toString("hex");

  return `pbkdf2_sha256:${passwordIterations}:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string | null) {
  if (!stored) return false;

  const [algorithm, iterationsRaw, salt, expectedHash] = stored.split(":");
  if (
    algorithm !== "pbkdf2_sha256" ||
    !iterationsRaw ||
    !salt ||
    !expectedHash
  ) {
    return false;
  }

  const iterations = Number(iterationsRaw);
  if (!Number.isFinite(iterations)) return false;

  const actualHash = crypto
    .pbkdf2Sync(password, salt, iterations, 32, "sha256")
    .toString("hex");

  return safeEqual(actualHash, expectedHash);
}

export async function createAdminSession(profileId: string) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionTtlMs);

  await prisma.adminSession.create({
    data: {
      tokenHash: hashSessionToken(token),
      profileId,
      expiresAt,
    },
  });

  const store = await cookies();
  store.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.round(sessionTtlMs / 1000),
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  const token = store.get(cookieName)?.value;

  if (token) {
    await prisma.adminSession.deleteMany({
      where: { tokenHash: hashSessionToken(token) },
    });
  }

  store.delete(cookieName);
}

export async function getAdminSessionProfile() {
  const store = await cookies();
  const token = store.get(cookieName)?.value;
  if (!token) return null;

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { profile: { include: { internProfile: true } } },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.adminSession.delete({ where: { id: session.id } });
    store.delete(cookieName);
    return null;
  }

  if (session.profile.role !== "ADMIN" && session.profile.role !== "TRACK_MASTER") {
    return null;
  }

  return session.profile;
}
