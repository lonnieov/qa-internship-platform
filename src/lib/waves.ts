import { prisma } from "@/lib/prisma";
import { slugifyTrack } from "@/lib/question-classification";

export const defaultWaveName = "Wave 1";
export const defaultWaveSlug = "wave-1";

export async function ensureDefaultWave(trackId: string) {
  return prisma.wave.upsert({
    where: {
      trackId_slug: {
        trackId,
        slug: defaultWaveSlug,
      },
    },
    update: {},
    create: {
      trackId,
      slug: defaultWaveSlug,
      name: defaultWaveName,
      order: 1,
    },
  });
}

export async function nextWaveOrder(trackId: string) {
  const lastWave = await prisma.wave.findFirst({
    where: { trackId },
    orderBy: { order: "desc" },
  });

  return (lastWave?.order ?? 0) + 1;
}

export async function uniqueWaveSlug(
  trackId: string,
  name: string,
  currentWaveId?: string,
) {
  const baseSlug = slugifyTrack(name || defaultWaveName);
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const existing = await prisma.wave.findUnique({
      where: { trackId_slug: { trackId, slug } },
    });
    if (!existing || existing.id === currentWaveId) return slug;

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}
