import crypto from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const cookieName = "qa_demo_admin";
const demoClerkUserId = "demo-admin";
const demoEmail = "admin@local.test";

function isEnabled() {
  return process.env.DEMO_ADMIN_ENABLED === "true";
}

function sessionSecret() {
  return (
    process.env.DEMO_ADMIN_SESSION_SECRET ||
    process.env.CLERK_SECRET_KEY ||
    "local-demo-session-secret"
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

export function verifyDemoAdminPassword(password: string) {
  const stored = process.env.DEMO_ADMIN_PASSWORD_HASH;
  if (!isEnabled() || !stored) return false;

  const [algorithm, iterationsRaw, salt, expectedHash] = stored.split(":");
  if (algorithm !== "pbkdf2_sha256" || !iterationsRaw || !salt || !expectedHash) {
    return false;
  }

  const iterations = Number(iterationsRaw);
  if (!Number.isFinite(iterations)) return false;

  const actualHash = crypto
    .pbkdf2Sync(password, salt, iterations, 32, "sha256")
    .toString("hex");

  return safeEqual(actualHash, expectedHash);
}

export async function createDemoAdminSession() {
  const expiresAt = Date.now() + 1000 * 60 * 60 * 12;
  const payload = Buffer.from(
    JSON.stringify({ sub: demoClerkUserId, role: "ADMIN", exp: expiresAt }),
  ).toString("base64url");
  const token = `${payload}.${sign(payload)}`;

  const store = await cookies();
  store.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  await ensureDemoAdminProfile();
}

export async function clearDemoAdminSession() {
  const store = await cookies();
  store.delete(cookieName);
}

export async function hasValidDemoAdminSession() {
  if (!isEnabled()) return false;

  const store = await cookies();
  const token = store.get(cookieName)?.value;
  if (!token) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(sign(payload), signature)) {
    return false;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return data.sub === demoClerkUserId && data.role === "ADMIN" && data.exp > Date.now();
  } catch {
    return false;
  }
}

export async function ensureDemoAdminProfile() {
  return prisma.profile.upsert({
    where: { clerkUserId: demoClerkUserId },
    update: {
      email: demoEmail,
      firstName: "Demo",
      lastName: "Admin",
      role: "ADMIN",
    },
    create: {
      clerkUserId: demoClerkUserId,
      email: demoEmail,
      firstName: "Demo",
      lastName: "Admin",
      role: "ADMIN",
    },
    include: { internProfile: true },
  });
}

export function isDemoAdminProfile(profile: { clerkUserId: string }) {
  return profile.clerkUserId === demoClerkUserId;
}
