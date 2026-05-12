import type { QuestionType } from "@/generated/prisma/enums";

const qaOnlyQuestionTypes: QuestionType[] = [
  "API_SANDBOX",
  "SQL_SANDBOX",
  "DEVTOOLS_SANDBOX",
  "MANUAL_QA_SANDBOX",
  "AUTOTEST_SANDBOX",
];

export function isQuestionTypeAllowedForTrack(
  questionType: QuestionType | string,
  trackSlug: string | null | undefined,
) {
  if (questionType === "QUIZ") return true;
  if (!qaOnlyQuestionTypes.includes(questionType as QuestionType)) return false;

  return trackSlug === "qa";
}
