export const questionTracks = ["QA", "API", "gRPC", "Mobile", "Web"] as const;

export type QuestionTrack = (typeof questionTracks)[number];

export const trackMeta: Record<
  QuestionTrack,
  { label: string; className: string; dotClassName: string }
> = {
  QA: {
    label: "QA",
    className: "track-chip track-chip-qa",
    dotClassName: "track-dot track-dot-qa",
  },
  API: {
    label: "API",
    className: "track-chip track-chip-api",
    dotClassName: "track-dot track-dot-api",
  },
  gRPC: {
    label: "gRPC",
    className: "track-chip track-chip-grpc",
    dotClassName: "track-dot track-dot-grpc",
  },
  Mobile: {
    label: "Mobile",
    className: "track-chip track-chip-mobile",
    dotClassName: "track-dot track-dot-mobile",
  },
  Web: {
    label: "Web",
    className: "track-chip track-chip-web",
    dotClassName: "track-dot track-dot-web",
  },
};

export function normalizeQuestionTrack(
  value: FormDataEntryValue | string | null | undefined,
) {
  const text = String(value ?? "").trim();
  return questionTracks.includes(text as QuestionTrack)
    ? (text as QuestionTrack)
    : "QA";
}

export function getQuestionTrackMeta(value: string | null | undefined) {
  const track = normalizeQuestionTrack(value);
  return trackMeta[track];
}
