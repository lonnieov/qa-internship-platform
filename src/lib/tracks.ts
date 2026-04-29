import { prisma } from "@/lib/prisma";
import {
  defaultTracks,
  normalizeLegacyTrack,
  slugifyTrack,
} from "@/lib/question-classification";

export async function ensureTracks() {
  const existingCount = await prisma.track.count();

  if (existingCount === 0) {
    await prisma.track.createMany({
      data: defaultTracks.map((track) => ({
        slug: track.slug,
        name: track.name,
        order: track.order,
      })),
      skipDuplicates: true,
    });
  }

  const tracks = await prisma.track.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });

  for (const track of tracks) {
    await prisma.question.updateMany({
      where: {
        trackId: null,
        track: normalizeLegacyTrack(track.name),
      },
      data: { trackId: track.id },
    });
  }

  return tracks;
}

export async function nextTrackOrder() {
  const lastTrack = await prisma.track.findFirst({
    orderBy: { order: "desc" },
  });

  return (lastTrack?.order ?? 0) + 1;
}

export async function uniqueTrackSlug(name: string, currentTrackId?: string) {
  const baseSlug = slugifyTrack(name);
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const existing = await prisma.track.findUnique({ where: { slug } });
    if (!existing || existing.id === currentTrackId) return slug;

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}
