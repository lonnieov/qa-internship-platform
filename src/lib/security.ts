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
