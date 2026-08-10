import { prisma } from "@/lib/prisma";
import { slugifyTrack } from "@/lib/question-classification";

export const defaultGradeName = "Общий";
export const defaultGradeSlug = "general";

export async function ensureDefaultGrade(trackId: string) {
  return prisma.grade.upsert({
    where: {
      trackId_slug: {
        trackId,
        slug: defaultGradeSlug,
      },
    },
    update: {},
    create: {
      trackId,
      slug: defaultGradeSlug,
      name: defaultGradeName,
      order: 1,
    },
  });
}

export async function nextGradeOrder(trackId: string) {
  const lastGrade = await prisma.grade.findFirst({
    where: { trackId },
    orderBy: { order: "desc" },
  });

  return (lastGrade?.order ?? 0) + 1;
}

export async function uniqueGradeSlug(
  trackId: string,
  name: string,
  currentGradeId?: string,
) {
  const baseSlug = slugifyTrack(name || defaultGradeName);
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const existing = await prisma.grade.findUnique({
      where: { trackId_slug: { trackId, slug } },
    });
    if (!existing || existing.id === currentGradeId) return slug;

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}
