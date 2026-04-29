import Link from "next/link";
import {
  createTrackAction,
  deleteTrackAction,
  toggleQuestionAction,
  toggleTrackAction,
  updateTrackAction,
} from "@/actions/admin";
import { stringifyPrettyJson } from "@/lib/api-sandbox";
import { prisma } from "@/lib/prisma";
import {
  getQuestionTrackMeta,
  getTrackSlug,
  type TrackSummary,
} from "@/lib/question-classification";
import { ensureTracks } from "@/lib/tracks";
import { QuestionDeleteForm } from "@/components/admin/question-delete-form";
import { QuestionForm } from "@/components/admin/question-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuestionCreateModal } from "@/components/admin/question-create-modal";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

type QuestionType = "QUIZ" | "API_SANDBOX" | "DEVTOOLS_SANDBOX";
type AdminQuestion = Awaited<ReturnType<typeof getQuestions>>[number];

async function getQuestions() {
  return prisma.question.findMany({
    orderBy: [
      { trackRef: { order: "asc" } },
      { track: "asc" },
      { order: "asc" },
      { createdAt: "asc" },
    ],
    include: {
      trackRef: true,
      options: { orderBy: { order: "asc" } },
    },
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

function filterUrl(type: QuestionType, track: string | "all") {
  const params = new URLSearchParams({ type });
  if (track !== "all") params.set("track", track);
  return `/admin/questions?${params.toString()}`;
}

function renderQuestionCard(
  question: AdminQuestion,
  indexLabel: string,
  tracks: TrackSummary[],
) {
  const track = getQuestionTrackMeta(question.trackRef ?? question.track);
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
            tracks={tracks}
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

function renderTrackControls(track: TrackSummary & { questionCount: number }) {
  const meta = getQuestionTrackMeta(track);
  const canDelete = track.questionCount === 0;

  return (
    <details className="track-manage-panel">
      <summary aria-label={`Управлять треком ${track.name}`}>...</summary>
      <div className="track-manage-body">
        <form action={updateTrackAction} className="form-grid">
          <input type="hidden" name="trackId" value={track.id ?? ""} />
          <label className="body-2 muted" htmlFor={`track-name-${track.id}`}>
            Название
          </label>
          <Input
            id={`track-name-${track.id}`}
            name="name"
            defaultValue={track.name}
            required
          />
          <label className="body-2 muted" htmlFor={`track-order-${track.id}`}>
            Порядок
          </label>
          <Input
            id={`track-order-${track.id}`}
            name="order"
            type="number"
            min="0"
            defaultValue={track.order ?? 0}
            required
          />
          <Button type="submit" size="sm">
            Сохранить
          </Button>
        </form>
        <form action={toggleTrackAction}>
          <input type="hidden" name="trackId" value={track.id ?? ""} />
          <input type="hidden" name="isActive" value={String(track.isActive)} />
          <Button type="submit" variant="secondary" size="sm">
            {track.isActive ? "Скрыть" : "Активировать"}
          </Button>
        </form>
        <form action={deleteTrackAction}>
          <input type="hidden" name="trackId" value={track.id ?? ""} />
          <Button
            type="submit"
            variant="destructive"
            size="sm"
            disabled={!canDelete}
            title={
              canDelete ? "Удалить трек" : "Сначала переместите или удалите вопросы"
            }
          >
            Удалить
          </Button>
        </form>
        <p className="body-2 muted m-0">
          <span className={meta.dotClassName} /> {track.questionCount} вопросов
        </p>
      </div>
    </details>
  );
}

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; track?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const tracks = await ensureTracks();
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
      : resolvedSearchParams.track;
  const selectedTrackRecord =
    selectedTrack === "all"
      ? null
      : tracks.find((track) => track.slug === selectedTrack) ?? null;
  const filteredByTrack =
    selectedTrack === "all"
      ? questions
      : questions.filter((question) => getTrackSlug(question) === selectedTrack);
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
    tracks.map((track) => [
      track.id,
      questions.filter((question) => getTrackSlug(question) === track.slug).length,
    ]),
  ) as Record<string, number>;
  const tracksForForms = tracks.map((track) => ({
    id: track.id,
    slug: track.slug,
    name: track.name,
    isActive: track.isActive,
    order: track.order,
  }));

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
          <div className="question-filter-title-row">
            <div className="question-filter-title">Треки</div>
          </div>
          <form action={createTrackAction} className="track-create-form">
            <Input
              aria-label="Название нового трека"
              name="name"
              placeholder="Новый трек"
              required
            />
            <Button type="submit" size="sm">
              <Plus size={16} />
            </Button>
          </form>
          <Link
            className={`question-filter-item ${selectedTrack === "all" ? "active" : ""}`}
            href={filterUrl(activeSection.type, "all")}
          >
            <span>Все треки</span>
            <span>{questions.length}</span>
          </Link>
          {tracks.map((track) => {
            const meta = getQuestionTrackMeta(track);
            const questionCount = trackCounts[track.id] ?? 0;
            const active = selectedTrackRecord?.id === track.id;
            return (
              <div className="track-filter-row" key={track.id}>
                <Link
                  className={`question-filter-item ${active ? "active" : ""} ${track.isActive ? "" : "muted-track"}`}
                  href={filterUrl(activeSection.type, track.slug)}
                >
                  <span className="nav-row">
                    <span className={meta.dotClassName} />
                    {meta.label}
                  </span>
                  <span>{questionCount}</span>
                </Link>
                {renderTrackControls({ ...track, questionCount })}
              </div>
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
                initialTrackId={selectedTrackRecord?.id}
                tracks={tracksForForms}
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
              renderQuestionCard(question, `${index + 1}`, tracksForForms),
            )
          )}
        </div>
      </section>
    </main>
  );
}
