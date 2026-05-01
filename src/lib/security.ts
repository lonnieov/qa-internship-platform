import crypto from "node:crypto";

export function generateInviteCode() {
  const raw = crypto.randomBytes(9).toString("base64url").toUpperCase();
  return raw.match(/.{1,4}/g)?.join("-") ?? raw;
}

export function hashInviteCode(code: string) {
  return crypto
    .createHash("sha256")
    .update(normalizeInviteCode(code))
    .digest("hex");
}

export function normalizeInviteCode(code: string) {
  return code.trim().replace(/\s+/g, "").toUpperCase();
}

export function maskInviteCode(inviteCode: string) {
  const normalized = inviteCode.trim().toUpperCase();
  const parts = normalized.split("-");

  if (parts.length >= 3) {
    return `${parts[0]}-••••-${parts.at(-1)}`;
  }

  if (normalized.length <= 8) return "••••";

  return `${normalized.slice(0, 4)}••••${normalized.slice(-4)}`;
}

function invitationTokenSecret() {
  return (
    process.env.INVITATION_TOKEN_ENCRYPTION_SECRET ||
    process.env.INTERN_SESSION_SECRET ||
    process.env.DEMO_ADMIN_SESSION_SECRET ||
    "local-invitation-token-secret"
  );
}

function invitationTokenKey() {
  return crypto.createHash("sha256").update(invitationTokenSecret()).digest();
}

export function encryptInviteCode(inviteCode: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", invitationTokenKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(inviteCode, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${ciphertext.toString("base64url")}`;
}

export function decryptInviteCode(encrypted: string | null | undefined) {
  if (!encrypted) return undefined;

  try {
    const [ivText, tagText, ciphertextText] = encrypted.split(".");
    if (!ivText || !tagText || !ciphertextText) return undefined;

    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      invitationTokenKey(),
      Buffer.from(ivText, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagText, "base64url"));

    return Buffer.concat([
      decipher.update(Buffer.from(ciphertextText, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return undefined;
  }
}
