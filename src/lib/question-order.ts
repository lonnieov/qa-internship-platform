type QuestionType =
  | "QUIZ"
  | "API_SANDBOX"
  | "SQL_SANDBOX"
  | "DEVTOOLS_SANDBOX"
  | "MANUAL_QA_SANDBOX"
  | "AUTOTEST_SANDBOX";

const questionTypePriority: Record<QuestionType, number> = {
  QUIZ: 0,
  API_SANDBOX: 1,
  SQL_SANDBOX: 2,
  DEVTOOLS_SANDBOX: 3,
  MANUAL_QA_SANDBOX: 4,
  AUTOTEST_SANDBOX: 5,
};

type OrderedQuestionLike = {
  type: QuestionType;
  order: number;
  createdAt: Date;
};

export function compareQuestionOrder<T extends OrderedQuestionLike>(left: T, right: T) {
  const typeDiff = questionTypePriority[left.type] - questionTypePriority[right.type];
  if (typeDiff !== 0) return typeDiff;

  const orderDiff = left.order - right.order;
  if (orderDiff !== 0) return orderDiff;

  return left.createdAt.getTime() - right.createdAt.getTime();
}
