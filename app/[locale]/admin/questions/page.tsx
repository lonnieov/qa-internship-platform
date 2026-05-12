import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { toggleQuestionAction } from "@/actions/admin";
import { stringifyPrettyJson } from "@/lib/api-sandbox";
import { prisma } from "@/lib/prisma";
import {
  getQuestionTrackMeta,
  type TrackSummary,
} from "@/lib/question-classification";
import { ensureTracks } from "@/lib/tracks";
import { getOpenQuizConfig } from "@/lib/open-quiz";
import { getManualQaSandboxConfig } from "@/lib/manual-qa-sandbox";
import { getSqlSandboxConfig } from "@/lib/sql-sandbox-config";
import { QuestionDeleteForm } from "@/components/admin/question-delete-form";
import { QuestionCreatedToast } from "@/components/admin/question-created-toast";
import { QuestionForm } from "@/components/admin/question-form";
import { SortableQuestionList } from "@/components/admin/sortable-question-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuestionCreateModal } from "@/components/admin/question-create-modal";
import { getManageableTrackIds, requireAdminAccess } from "@/lib/auth";
import { isQuestionTypeAllowedForTrack } from "@/lib/question-type-policy";

type QuestionType =
  | "QUIZ"
  | "API_SANDBOX"
  | "SQL_SANDBOX"
  | "DEVTOOLS_SANDBOX"
  | "MANUAL_QA_SANDBOX"
  | "AUTOTEST_SANDBOX";
type AdminQuestion = Awaited<ReturnType<typeof getQuestions>>[number];

async function getQuestions(trackIds?: string[] | null) {
  return prisma.question.findMany({
    where: trackIds ? { trackId: { in: trackIds } } : undefined,
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

function sectionMeta(
  type: QuestionType,
  t: Awaited<ReturnType<typeof getTranslations>>,
) {
  switch (type) {
    case "API_SANDBOX":
      return {
        id: "api-sandbox",
        title: t("typeLabels.api"),
        description: t("sections.api.description"),
      };
    case "DEVTOOLS_SANDBOX":
      return {
        id: "devtools-sandbox",
        title: t("typeLabels.devtools"),
        description: t("sections.devtools.description"),
      };
    case "SQL_SANDBOX":
      return {
        id: "sql-sandbox",
        title: t("typeLabels.sql"),
        description: t("sections.sql.description"),
      };
    case "MANUAL_QA_SANDBOX":
      return {
        id: "manual-qa-sandbox",
        title: t("typeLabels.manualQa"),
        description: t("sections.manualQa.description"),
      };
    case "AUTOTEST_SANDBOX":
      return {
        id: "autotest-sandbox",
        title: t("typeLabels.autotest"),
        description: t("sections.autotest.description"),
      };
    default:
      return {
        id: "quiz",
        title: t("typeLabels.quiz"),
        description: t("sections.quiz.description"),
      };
  }
}

function typeLabel(
  type: QuestionType,
  t: Awaited<ReturnType<typeof getTranslations>>,
) {
  if (type === "API_SANDBOX") return t("typeLabels.api");
  if (type === "SQL_SANDBOX") return t("typeLabels.sql");
  if (type === "DEVTOOLS_SANDBOX") return t("typeLabels.devtoolsShort");
  if (type === "MANUAL_QA_SANDBOX") return t("typeLabels.manualQa");
  if (type === "AUTOTEST_SANDBOX") return t("typeLabels.autotest");
  return t("typeLabels.quiz");
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
  t: Awaited<ReturnType<typeof getTranslations>>,
) {
  const summary = apiSummary(question);
  const manualQaConfig = getManualQaSandboxConfig(question.apiConfig);
  const sqlConfig = getSqlSandboxConfig(question.apiConfig);

  return (
    <Card className="question-bank-card" key={question.id}>
      <div className="question-index">{indexLabel.padStart(2, "0")}</div>
      <div className="stack">
        <div className="nav-row">
          <span className="type-chip">{typeLabel(question.type, t)}</span>
          <Badge variant={question.isActive ? "success" : "muted"}>
            {question.isActive ? t("status.active") : t("status.hidden")}
          </Badge>
        </div>
        <div>
          <h3 className="section-title">{question.text}</h3>
          {question.explanation ? (
            <p className="body-2 muted m-0">{question.explanation}</p>
          ) : null}
        </div>
        {question.type === "SQL_SANDBOX" && sqlConfig ? (
          <div className="stack">
            <div className="nav-row">
              <code className="type-chip">{sqlConfig.dialect}</code>
              <code className="type-chip">
                {t("meta.tables", { count: sqlConfig.tables.length })}
              </code>
              <code className="type-chip">
                {sqlConfig.expectedResult.columns.join(", ")}
              </code>
            </div>
            <div className="soft-panel stack">
              <strong>{sqlConfig.taskTitle}</strong>
              <p className="body-2 muted m-0">{sqlConfig.mission}</p>
            </div>
          </div>
        ) : question.type === "MANUAL_QA_SANDBOX" && manualQaConfig ? (
          <div className="stack">
            <div className="nav-row">
              <code className="type-chip">{manualQaConfig.appPreset}</code>
              <code className="type-chip">
                {manualQaConfig.viewport.width}x
                {manualQaConfig.viewport.height}
              </code>
              <code className="type-chip">
                {t("meta.knownBugs", { count: manualQaConfig.knownBugs.length })}
              </code>
            </div>
            <div className="soft-panel stack">
              <strong>{manualQaConfig.scenarioTitle}</strong>
              <p className="body-2 muted m-0">{manualQaConfig.mission}</p>
            </div>
          </div>
        ) : question.type === "API_SANDBOX" ||
          question.type === "DEVTOOLS_SANDBOX" ? (
          <div className="stack">
            <div className="nav-row">
              <code className="type-chip">{summary.method}</code>
              <code className="type-chip">{summary.path}</code>
              <code className="type-chip">
                {t("meta.status", { status: summary.status })}
              </code>
            </div>
            <div className="soft-panel">
              <pre className="body-2 m-0 whitespace-pre-wrap">
                {stringifyPrettyJson(question.apiConfig)}
              </pre>
            </div>
          </div>
        ) : (
          (() => {
            const openQuiz = getOpenQuizConfig(question.apiConfig);

            if (openQuiz) {
              return (
                <div className="soft-panel stack">
                  <Badge variant="muted">{t("openQuestion.label")}</Badge>
                  {openQuiz.answerLabel ? (
                    <p className="body-2 muted m-0">{openQuiz.answerLabel}</p>
                  ) : null}
                  {openQuiz.expectedAnswer ? (
                    <p className="body-2 m-0">
                      <strong>{t("openQuestion.reviewerHint")}:</strong>{" "}
                      {openQuiz.expectedAnswer}
                    </p>
                  ) : (
                    <p className="body-2 muted m-0">
                      {t("openQuestion.reviewerHintMissing")}
                    </p>
                  )}
                </div>
              );
            }

            return (
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
            );
          })()
        )}
        <details className="edit-question-panel">
          <summary>{t("edit")}</summary>
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
                {question.isActive ? t("hide") : t("activate")}
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
  params,
  searchParams,
}: {
  params: Promise<{ locale: "ru" | "uz" }>;
  searchParams: Promise<{ type?: string; track?: string; created?: string }>;
}) {
  await params;
  const t = await getTranslations("AdminQuestions");
  const profile = await requireAdminAccess();
  const manageableTrackIds = await getManageableTrackIds(profile);
  const resolvedSearchParams = await searchParams;
  const allTracks = await ensureTracks();
  const tracks = manageableTrackIds
    ? allTracks.filter((track) => manageableTrackIds.includes(track.id))
    : allTracks;
  if (tracks.length === 0) {
    redirect("/admin/tracks");
  }

  const requestedTrack = resolvedSearchParams.track;
  const requestedTrackRecord = tracks.find(
    (track) => track.slug === requestedTrack,
  );
  const selectedTrackRecord = manageableTrackIds
    ? (requestedTrackRecord ?? tracks[0])
    : (requestedTrackRecord ?? null);

  if (
    manageableTrackIds &&
    (!requestedTrack || requestedTrack !== selectedTrackRecord?.slug)
  ) {
    redirect(`/admin/questions?track=${selectedTrackRecord?.slug}`);
  }

  const selectedTrackSlug = selectedTrackRecord?.slug ?? "all";
  const allAccessibleQuestions = await getQuestions(manageableTrackIds);
  const questions = selectedTrackRecord
    ? allAccessibleQuestions.filter(
        (question) => question.trackId === selectedTrackRecord.id,
      )
    : allAccessibleQuestions;
  const requestedType =
    resolvedSearchParams.type === "API_SANDBOX" ||
    resolvedSearchParams.type === "SQL_SANDBOX" ||
    resolvedSearchParams.type === "DEVTOOLS_SANDBOX" ||
    resolvedSearchParams.type === "MANUAL_QA_SANDBOX" ||
    resolvedSearchParams.type === "AUTOTEST_SANDBOX" ||
    resolvedSearchParams.type === "QUIZ"
      ? resolvedSearchParams.type
      : "QUIZ";
  const selectedType =
    selectedTrackRecord &&
    !isQuestionTypeAllowedForTrack(requestedType, selectedTrackRecord.slug)
      ? "QUIZ"
      : requestedType;
  const filteredByTrack = questions;
  const quizQuestions = filteredByTrack.filter(
    (question) => question.type === "QUIZ",
  );
  const apiSandboxQuestions = filteredByTrack.filter(
    (question) => question.type === "API_SANDBOX",
  );
  const sqlSandboxQuestions = filteredByTrack.filter(
    (question) => question.type === "SQL_SANDBOX",
  );
  const devtoolsSandboxQuestions = filteredByTrack.filter(
    (question) => question.type === "DEVTOOLS_SANDBOX",
  );
  const manualQaSandboxQuestions = filteredByTrack.filter(
    (question) => question.type === "MANUAL_QA_SANDBOX",
  );
  const autotestSandboxQuestions = filteredByTrack.filter(
    (question) => question.type === "AUTOTEST_SANDBOX",
  );
  const sections: Array<{ type: QuestionType; items: AdminQuestion[] }> = [
    { type: "QUIZ" as const, items: quizQuestions },
    { type: "API_SANDBOX" as const, items: apiSandboxQuestions },
    { type: "SQL_SANDBOX" as const, items: sqlSandboxQuestions },
    { type: "DEVTOOLS_SANDBOX" as const, items: devtoolsSandboxQuestions },
    { type: "MANUAL_QA_SANDBOX" as const, items: manualQaSandboxQuestions },
    { type: "AUTOTEST_SANDBOX" as const, items: autotestSandboxQuestions },
  ].filter(
    (section) =>
      !selectedTrackRecord ||
      isQuestionTypeAllowedForTrack(section.type, selectedTrackRecord.slug),
  );
  const activeSection =
    sections.find((section) => section.type === selectedType) ?? sections[0];
  const activeMeta = sectionMeta(activeSection.type, t);
  const allTypeCount = (type: QuestionType) =>
    filteredByTrack.filter((question) => question.type === type).length;
  const trackCounts = Object.fromEntries(
    tracks.map((track) => [
      track.id,
      allAccessibleQuestions.filter((question) => question.trackId === track.id)
        .length,
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
      {resolvedSearchParams.created === "1" ? <QuestionCreatedToast /> : null}
      <div className="page-header">
        <div>
          <h1 className="head-1">{t("title")}</h1>
          <p className="body-1 muted m-0">
            {selectedTrackRecord?.name ?? t("tracks.all")} · {t("description")}
          </p>
        </div>
      </div>

      <section className="surface question-bank-layout">
        {profile.role === "ADMIN" ? (
          <aside className="question-filter-rail">
            <div className="question-filter-title-row">
              <div className="question-filter-title">{t("tracks.title")}</div>
            </div>
            <Link
              className={`question-filter-item ${selectedTrackSlug === "all" ? "active" : ""}`}
              href={filterUrl(activeSection.type, "all")}
            >
              <span>{t("tracks.all")}</span>
              <span>{allAccessibleQuestions.length}</span>
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
                </div>
              );
            })}
          </aside>
        ) : null}

        <div
          className="question-list-panel"
          style={profile.role === "ADMIN" ? undefined : { gridColumn: "1 / -1" }}
        >
          <div className="nav-row">
            {sections.map(({ type }) => {
              const meta = sectionMeta(type, t);
              const active = type === activeSection.type;

              return (
                <Button
                  key={meta.id}
                  asChild
                  size="sm"
                  variant={active ? "default" : "outline"}
                >
                  <Link href={filterUrl(type, selectedTrackSlug)}>
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
                {t("empty")}
              </CardContent>
            </Card>
          ) : (
            <SortableQuestionList
              key={activeSection.items.map((question) => question.id).join("|")}
              questionIds={activeSection.items.map((question) => question.id)}
            >
              {activeSection.items.map((question, index) =>
                renderQuestionCard(
                  question,
                  `${index + 1}`,
                  tracksForForms,
                  t,
                ),
              )}
            </SortableQuestionList>
          )}
        </div>
      </section>
    </main>
  );
}
