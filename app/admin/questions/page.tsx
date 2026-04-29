import Link from "next/link";
import { toggleQuestionAction } from "@/actions/admin";
import { stringifyPrettyJson } from "@/lib/api-sandbox";
import { prisma } from "@/lib/prisma";
import {
  getQuestionTrackMeta,
  normalizeQuestionTrack,
  questionTracks,
  type QuestionTrack,
} from "@/lib/question-classification";
import { QuestionDeleteForm } from "@/components/admin/question-delete-form";
import { QuestionForm } from "@/components/admin/question-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuestionCreateModal } from "@/components/admin/question-create-modal";

type QuestionType = "QUIZ" | "API_SANDBOX" | "DEVTOOLS_SANDBOX";
type AdminQuestion = Awaited<ReturnType<typeof getQuestions>>[number];

async function getQuestions() {
  return prisma.question.findMany({
    orderBy: [{ track: "asc" }, { order: "asc" }, { createdAt: "asc" }],
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

function typeLabel(type: QuestionType) {
  if (type === "API_SANDBOX") return "API Sandbox";
  if (type === "DEVTOOLS_SANDBOX") return "DevTools";
  return "Quiz";
}

function apiSummary(question: AdminQuestion) {
  const config =
    question.apiConfig &&
    typeof question.apiConfig === "object" &&
    !Array.isArray(question.apiConfig)
      ? (question.apiConfig as {
          method?: string;
          path?: string;
          successStatus?: number;
        })
      : {};

  return {
    method: config.method ?? "GET",
    path: config.path ?? "/",
    status: config.successStatus ?? 200,
  };
}

function filterUrl(type: QuestionType, track: QuestionTrack | "all") {
  const params = new URLSearchParams({ type });
  if (track !== "all") params.set("track", track);
  return `/admin/questions?${params.toString()}`;
}

function renderQuestionCard(question: AdminQuestion, indexLabel: string) {
  const track = getQuestionTrackMeta(question.track);
  const summary = apiSummary(question);

  return (
    <Card className="question-bank-card" key={question.id}>
      <div className="question-index">{indexLabel.padStart(2, "0")}</div>
      <div className="stack">
        <div className="nav-row">
          <span className={track.className}>{track.label}</span>
          <span className="type-chip">{typeLabel(question.type)}</span>
          <Badge variant={question.isActive ? "success" : "muted"}>
            {question.isActive ? "активен" : "скрыт"}
          </Badge>
        </div>
        <div>
          <h3 className="section-title">{question.text}</h3>
          {question.explanation ? (
            <p className="body-2 muted m-0">{question.explanation}</p>
          ) : null}
        </div>
        {question.type === "API_SANDBOX" ||
        question.type === "DEVTOOLS_SANDBOX" ? (
          <div className="stack">
            <div className="nav-row">
              <code className="type-chip">{summary.method}</code>
              <code className="type-chip">{summary.path}</code>
              <code className="type-chip">status {summary.status}</code>
            </div>
            <div className="soft-panel">
              <pre className="body-2 m-0 whitespace-pre-wrap">
                {stringifyPrettyJson(question.apiConfig)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="question-option-grid">
            {question.options.map((option) => (
              <div
                className={`question-option-preview ${option.isCorrect ? "correct" : ""}`}
                key={option.id}
              >
                <span className="question-option-marker">
                  {option.isCorrect ? "✓" : ""}
                </span>
                <span>
                  <strong>{option.label}.</strong> {option.text}
                </span>
              </div>
            ))}
          </div>
        )}
        <details className="edit-question-panel">
          <summary>Редактировать</summary>
          <QuestionForm
            embedded
            initialType={question.type}
            question={question}
          />
        </details>
      </div>
      <div
        className="stack"
        style={{ alignContent: "start", justifyItems: "end" }}
      >
        <div
          className="nav-row"
          style={{ alignItems: "flex-end", justifyContent: "space-between" }}
        >
          <div className="nav-row">
            <form action={toggleQuestionAction}>
              <input type="hidden" name="questionId" value={question.id} />
              <input
                type="hidden"
                name="isActive"
                value={String(question.isActive)}
              />
              <Button type="submit" variant="secondary" size="sm">
                {question.isActive ? "Скрыть" : "Активировать"}
              </Button>
            </form>
            <QuestionDeleteForm questionId={question.id} />
          </div>
        </div>
      </div>
    </Card>
  );
}

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; track?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const questions = await getQuestions();
  const selectedType =
    resolvedSearchParams.type === "API_SANDBOX" ||
    resolvedSearchParams.type === "DEVTOOLS_SANDBOX" ||
    resolvedSearchParams.type === "QUIZ"
      ? resolvedSearchParams.type
      : "QUIZ";
  const selectedTrack =
    resolvedSearchParams.track === "all" || !resolvedSearchParams.track
      ? "all"
      : normalizeQuestionTrack(resolvedSearchParams.track);
  const filteredByTrack =
    selectedTrack === "all"
      ? questions
      : questions.filter((question) => question.track === selectedTrack);
  const quizQuestions = filteredByTrack.filter(
    (question) => question.type === "QUIZ",
  );
  const apiSandboxQuestions = filteredByTrack.filter(
    (question) => question.type === "API_SANDBOX",
  );
  const devtoolsSandboxQuestions = filteredByTrack.filter(
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
  const allTypeCount = (type: QuestionType) =>
    questions.filter((question) => question.type === type).length;
  const trackCounts = Object.fromEntries(
    questionTracks.map((track) => [
      track,
      questions.filter((question) => question.track === track).length,
    ]),
  ) as Record<QuestionTrack, number>;

  return (
    <main className="page stack-lg">
      <div className="page-header">
        <div>
          <h1 className="head-1">Банк вопросов</h1>
          <p className="body-1 muted m-0">
            Вопросы классифицируются по трекам и типам задач.
          </p>
        </div>
      </div>

      <section className="surface question-bank-layout">
        <aside className="question-filter-rail">
          <div className="question-filter-title">Треки</div>
          <Link
            className={`question-filter-item ${selectedTrack === "all" ? "active" : ""}`}
            href={filterUrl(activeSection.type, "all")}
          >
            <span>Все треки</span>
            <span>{questions.length}</span>
          </Link>
          {questionTracks.map((track) => {
            const meta = getQuestionTrackMeta(track);
            return (
              <Link
                className={`question-filter-item ${selectedTrack === track ? "active" : ""}`}
                href={filterUrl(activeSection.type, track)}
                key={track}
              >
                <span className="nav-row">
                  <span className={meta.dotClassName} />
                  {meta.label}
                </span>
                <span>{trackCounts[track]}</span>
              </Link>
            );
          })}
        </aside>

        <div className="question-list-panel">
          <div className="nav-row">
            {sections.map(({ type }) => {
              const meta = sectionMeta(type);
              const active = type === activeSection.type;

              return (
                <Button
                  key={meta.id}
                  asChild
                  size="sm"
                  variant={active ? "default" : "outline"}
                >
                  <Link href={filterUrl(type, selectedTrack)}>
                    {meta.title} ({allTypeCount(type)})
                  </Link>
                </Button>
              );
            })}
          </div>

          <div className="page-header" style={{ marginBottom: 0 }}>
            <div>
              <h2 className="head-2">{activeMeta.title}</h2>
              <p className="body-2 muted m-0">{activeMeta.description}</p>
            </div>
            <div className="nav-row">
              <Badge variant="muted">{activeSection.items.length}</Badge>
              <QuestionCreateModal
                initialType={activeSection.type}
                initialTrack={selectedTrack === "all" ? "QA" : selectedTrack}
              />
            </div>
          </div>

          {activeSection.items.length === 0 ? (
            <Card>
              <CardContent className="p-6 muted">
                Пока нет вопросов в выбранном срезе.
              </CardContent>
            </Card>
          ) : (
            activeSection.items.map((question, index) =>
              renderQuestionCard(question, `${index + 1}`),
            )
          )}
        </div>
      </section>
    </main>
  );
}
