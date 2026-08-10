import { prisma } from "@/lib/prisma";

export const defaultVersionName = "Версия 1";

export async function ensureDefaultVersion(gradeId: string) {
  const existing = await prisma.questionVersion.findFirst({
    where: { gradeId },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing;

  return prisma.questionVersion.create({
    data: {
      gradeId,
      name: defaultVersionName,
      isActive: true,
    },
  });
}

export async function nextVersionName(gradeId: string) {
  const count = await prisma.questionVersion.count({ where: { gradeId } });
  return `Версия ${count + 1}`;
}
