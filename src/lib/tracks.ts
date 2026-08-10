import { prisma } from "@/lib/prisma";
import {
  defaultTracks,
  normalizeLegacyTrack,
  slugifyTrack,
} from "@/lib/question-classification";
import { ensureDefaultWave } from "@/lib/waves";
import { ensureDefaultGrade } from "@/lib/grades";
import { ensureDefaultVersion } from "@/lib/question-versions";

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
    const existingGrade = await prisma.grade.findFirst({
      where: { trackId: track.id },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    const grade = existingGrade ?? (await ensureDefaultGrade(track.id));
    const version = await ensureDefaultVersion(grade.id);

    await prisma.question.updateMany({
      where: {
        trackId: null,
        track: normalizeLegacyTrack(track.name),
      },
      data: { trackId: track.id },
    });

    await prisma.question.updateMany({
      where: {
        trackId: track.id,
        gradeId: null,
      },
      data: { gradeId: grade.id, versionId: version.id },
    });
  }

  const qaTrack = tracks.find((track) => track.slug === "qa") ?? tracks[0];
  if (qaTrack) {
    const qaWave = await ensureDefaultWave(qaTrack.id);
    const existingQaGrade = await prisma.grade.findFirst({
      where: { trackId: qaTrack.id },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    const qaGrade = existingQaGrade ?? (await ensureDefaultGrade(qaTrack.id));
    const qaVersion = await ensureDefaultVersion(qaGrade.id);
    const legacyQaTaskTrackIds = tracks
      .filter((track) => ["api", "grpc", "web"].includes(track.slug))
      .map((track) => track.id);

    if (legacyQaTaskTrackIds.length > 0) {
      await prisma.question.updateMany({
        where: { trackId: { in: legacyQaTaskTrackIds } },
        data: {
          trackId: qaTrack.id,
          track: qaTrack.name,
          gradeId: qaGrade.id,
          versionId: qaVersion.id,
        },
      });
      await prisma.track.updateMany({
        where: { id: { in: legacyQaTaskTrackIds } },
        data: { isActive: false },
      });
    }

    await prisma.invitation.updateMany({
      where: { trackId: null },
      data: { trackId: qaTrack.id, waveId: qaWave.id, gradeId: qaGrade.id },
    });
    await prisma.internProfile.updateMany({
      where: { trackId: null },
      data: { trackId: qaTrack.id, waveId: qaWave.id, gradeId: qaGrade.id },
    });
    await prisma.assessmentAttempt.updateMany({
      where: { trackId: null },
      data: { trackId: qaTrack.id, waveId: qaWave.id, gradeId: qaGrade.id },
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
