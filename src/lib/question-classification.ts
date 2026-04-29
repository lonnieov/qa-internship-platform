export type TrackSummary = {
  id?: string | null;
  slug: string;
  name: string;
  isActive?: boolean;
  order?: number;
};

export const defaultTracks = [
  { slug: "qa", name: "QA", order: 1 },
  { slug: "api", name: "API", order: 2 },
  { slug: "grpc", name: "gRPC", order: 3 },
  { slug: "mobile", name: "Mobile", order: 4 },
  { slug: "web", name: "Web", order: 5 },
] as const;

export const fallbackTrack = defaultTracks[0];

const legacyTrackByName = new Map<string, (typeof defaultTracks)[number]>(
  defaultTracks.map((track) => [track.name.toLowerCase(), track]),
);

const legacyTrackBySlug = new Map<string, (typeof defaultTracks)[number]>(
  defaultTracks.map((track) => [track.slug, track]),
);

export function slugifyTrack(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "track"
  );
}

export function normalizeLegacyTrack(value: string | null | undefined) {
  const text = String(value ?? "").trim();
  const known =
    legacyTrackByName.get(text.toLowerCase()) ??
    legacyTrackBySlug.get(slugifyTrack(text));

  return known?.name ?? fallbackTrack.name;
}

export function getTrackDisplayName(track: {
  track?: string | null;
  trackRef?: { name: string } | null;
}) {
  return track.trackRef?.name ?? normalizeLegacyTrack(track.track);
}

export function getTrackSlug(track: {
  track?: string | null;
  trackRef?: { slug: string } | null;
}) {
  return track.trackRef?.slug ?? slugifyTrack(normalizeLegacyTrack(track.track));
}

export function getQuestionTrackMeta(
  value:
    | string
    | null
    | undefined
    | { slug?: string | null; name?: string | null },
) {
  const slug =
    typeof value === "object" && value
      ? slugifyTrack(value.slug ?? value.name ?? fallbackTrack.slug)
      : slugifyTrack(normalizeLegacyTrack(value));
  const name =
    typeof value === "object" && value
      ? (value.name ?? value.slug ?? fallbackTrack.name)
      : normalizeLegacyTrack(value);

  const tone = ["api", "grpc", "mobile", "web"].includes(slug) ? slug : "qa";

  return {
    label: name,
    className: `track-chip track-chip-${tone}`,
    dotClassName: `track-dot track-dot-${tone}`,
  };
}
