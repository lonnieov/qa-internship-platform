import type { Prisma } from "@/generated/prisma/client";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function normalizeInternComment(value: unknown) {
  return String(value ?? "").trim().slice(0, 1000);
}

export function getInternComment(value: unknown) {
  if (!isRecord(value)) return "";

  return normalizeInternComment(value.internComment);
}

export function mergeInternComment(
  value: unknown,
  internComment: string,
): Prisma.InputJsonObject {
  const base = isRecord(value) ? value : {};
  const normalized = normalizeInternComment(internComment);

  if (!normalized) {
    const rest = { ...base };
    delete rest.internComment;
    return rest as Prisma.InputJsonObject;
  }

  return {
    ...base,
    internComment: normalized,
  } as Prisma.InputJsonObject;
}
