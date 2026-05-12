import { prisma } from "@/lib/prisma";
import {
  defaultTracks,
  normalizeLegacyTrack,
  slugifyTrack,
} from "@/lib/question-classification";
import { ensureDefaultWave } from "@/lib/waves";

export async function ensureTracks() {
  await Promise.all(
    defaultTracks.map((track) =>
      prisma.track.upsert({
        where: { slug: track.slug },
        update: {
          name: track.name,
          order: track.order,
        },
        create: {
          slug: track.slug,
          name: track.name,
          order: track.order,
        },
      }),
    ),
  );

  const tracks = await prisma.track.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
  });

  for (const track of tracks) {
    await ensureDefaultWave(track.id);

    await prisma.question.updateMany({
      where: {
        trackId: null,
        track: normalizeLegacyTrack(track.name),
      },
      data: { trackId: track.id },
    });
  }

  const qaTrack = tracks.find((track) => track.slug === "qa") ?? tracks[0];
  if (qaTrack) {
    const qaWave = await ensureDefaultWave(qaTrack.id);
    const legacyQaTaskTrackIds = tracks
      .filter((track) => ["api", "grpc", "web"].includes(track.slug))
      .map((track) => track.id);

    if (legacyQaTaskTrackIds.length > 0) {
      await prisma.question.updateMany({
        where: { trackId: { in: legacyQaTaskTrackIds } },
        data: { trackId: qaTrack.id, track: qaTrack.name },
      });
      await prisma.track.updateMany({
        where: { id: { in: legacyQaTaskTrackIds } },
        data: { isActive: false },
      });
    }

    await prisma.invitation.updateMany({
      where: { trackId: null },
      data: { trackId: qaTrack.id, waveId: qaWave.id },
    });
    await prisma.internProfile.updateMany({
      where: { trackId: null },
      data: { trackId: qaTrack.id, waveId: qaWave.id },
    });
    await prisma.assessmentAttempt.updateMany({
      where: { trackId: null },
      data: { trackId: qaTrack.id, waveId: qaWave.id },
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
