import Link from "next/link";
import { toggleQuestionAction } from "@/actions/admin";
import { stringifyPrettyJson } from "@/lib/api-sandbox";
import { prisma } from "@/lib/prisma";
import { QuestionDeleteForm } from "@/components/admin/question-delete-form";
import { QuestionForm } from "@/components/admin/question-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type QuestionType = "QUIZ" | "API_SANDBOX" | "DEVTOOLS_SANDBOX";
type AdminQuestion = Awaited<ReturnType<typeof getQuestions>>[number];

async function getQuestions() {
  return prisma.question.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { options: { orderBy: { order: "asc" } } },
  });
}

function sectionMeta(type: QuestionType) {
  switch (type) {
    case "API_SANDBOX":
      return {
        id: "api-sandbox",
        title: "API Sandbox",
        description: "Задачи на ручную отправку и проверку API-запросов.",
      };
    case "DEVTOOLS_SANDBOX":
      return {
        id: "devtools-sandbox",
        title: "DevTools Sandbox",
        description: "Задачи на работу с Network и ответами из DevTools.",
      };
    default:
      return {
        id: "quiz",
        title: "Quiz",
        description: "Классические тестовые вопросы с вариантами ответов.",
      };
  }
}

function renderQuestionCard(question: AdminQuestion, indexLabel: string) {
  return (
    <Card key={question.id}>
      <CardHeader>
        <div className="metric">
          <div>
            <CardTitle>
              {indexLabel}. {question.text}
            </CardTitle>
            {question.explanation ? (
              <p className="body-2 muted m-0">{question.explanation}</p>
            ) : null}
          </div>
          <Badge variant={question.isActive ? "success" : "muted"}>
            {question.isActive ? "активен" : "скрыт"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="stack">
        {question.type === "API_SANDBOX" || question.type === "DEVTOOLS_SANDBOX" ? (
          <div className="stack">
            <div className="soft-panel">
              <pre className="body-2 m-0 whitespace-pre-wrap">
                {stringifyPrettyJson(question.apiConfig)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="grid-2">
            {question.options.map((option) => (
              <div
                className="soft-panel"
                key={option.id}
                style={{
                  border: option.isCorrect ? "1px solid var(--accent)" : undefined,
                }}
              >
                <strong>{option.label}.</strong> {option.text}
              </div>
            ))}
          </div>
        )}
        <div
          className="nav-row"
          style={{ alignItems: "flex-end", justifyContent: "space-between" }}
        >
          <form action={toggleQuestionAction}>
            <input type="hidden" name="questionId" value={question.id} />
            <input type="hidden" name="isActive" value={String(question.isActive)} />
            <Button type="submit" variant="secondary" size="sm">
              {question.isActive ? "Скрыть" : "Активировать"}
            </Button>
          </form>
          <QuestionDeleteForm questionId={question.id} />
        </div>
      </CardContent>
    </Card>
  );
}

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const questions = await getQuestions();
  const selectedType =
    resolvedSearchParams.type === "API_SANDBOX" ||
    resolvedSearchParams.type === "DEVTOOLS_SANDBOX" ||
    resolvedSearchParams.type === "QUIZ"
      ? resolvedSearchParams.type
      : "QUIZ";
  const quizQuestions = questions.filter((question) => question.type === "QUIZ");
  const apiSandboxQuestions = questions.filter((question) => question.type === "API_SANDBOX");
  const devtoolsSandboxQuestions = questions.filter(
    (question) => question.type === "DEVTOOLS_SANDBOX",
  );
  const sections: Array<{ type: QuestionType; items: AdminQuestion[] }> = [
    { type: "QUIZ" as const, items: quizQuestions },
    { type: "API_SANDBOX" as const, items: apiSandboxQuestions },
    { type: "DEVTOOLS_SANDBOX" as const, items: devtoolsSandboxQuestions },
  ];
  const activeSection =
    sections.find((section) => section.type === selectedType) ?? sections[0];
  const activeMeta = sectionMeta(activeSection.type);

  return (
    <main className="page stack-lg">
      <div className="page-header">
        <div>
          <h1 className="head-1">Банк вопросов</h1>
          <p className="body-1 muted m-0">
            Поддерживаются quiz-вопросы и упрощённые API sandbox задачи.
          </p>
        </div>
      </div>

      <section className="stack">
        <div className="nav-row">
          {sections.map(({ type, items }) => {
            const meta = sectionMeta(type);
            const active = type === activeSection.type;

            return (
              <Button
                key={meta.id}
                asChild
                size="sm"
                variant={active ? "default" : "outline"}
              >
                <Link href={`/admin/questions?type=${type}`}>
                  {meta.title} ({items.length})
                </Link>
              </Button>
            );
          })}
        </div>

        <section className="stack" id={activeMeta.id}>
          <div className="page-header" style={{ marginBottom: 0 }}>
            <div>
              <h2 className="head-2">{activeMeta.title}</h2>
              <p className="body-2 muted m-0">{activeMeta.description}</p>
            </div>
            <Badge variant="muted">{activeSection.items.length}</Badge>
          </div>

          <QuestionForm key={activeSection.type} initialType={activeSection.type} />

          {activeSection.items.length === 0 ? (
            <Card>
              <CardContent className="p-6 muted">Пока нет вопросов в этом разделе.</CardContent>
            </Card>
          ) : (
            activeSection.items.map((question, index) =>
              renderQuestionCard(question, `${index + 1}`),
            )
          )}
        </section>

        {questions.length === 0 ? (
          <Card>
            <CardContent className="p-6 muted">Пока нет вопросов.</CardContent>
          </Card>
        ) : null}
      </section>
    </main>
  );
}
