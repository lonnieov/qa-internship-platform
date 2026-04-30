export type OpenQuizConfig = {
  mode: "OPEN_TEXT";
  expectedAnswer: string;
  answerLabel?: string;
  placeholder?: string;
};

type OpenQuizDraft = Partial<OpenQuizConfig>;

export function getOpenQuizConfig(input: unknown): OpenQuizConfig | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  const draft = input as OpenQuizDraft;
  if (draft.mode !== "OPEN_TEXT") {
    return null;
  }

  const expectedAnswer = String(draft.expectedAnswer ?? "").trim();
  if (!expectedAnswer) {
    return null;
  }

  return {
    mode: "OPEN_TEXT",
    expectedAnswer,
    answerLabel: String(draft.answerLabel ?? "").trim() || undefined,
    placeholder: String(draft.placeholder ?? "").trim() || undefined,
  };
}

export function normalizeOpenQuizAnswer(value: string) {
  return value.trim().replace(/\s+/g, " ");
}
