import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Inbox, MoreHorizontal, Plus } from "lucide-react";
import {
  activateQuestionVersionAction,
  createQuestionVersionAction,
  deleteQuestionVersionAction,
  duplicateQuestionVersionAction,
} from "@/actions/admin";
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
import { QuestionToggleButton } from "@/components/admin/question-toggle-button";
import { QuestionCreatedToast } from "@/components/admin/question-created-toast";
import { QuestionForm } from "@/components/admin/question-form";
import { SortableQuestionList } from "@/components/admin/sortable-question-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QuestionCreateModal } from "@/components/admin/question-create-modal";
import { QuestionImportModal } from "@/components/admin/question-import-modal";
import { QuestionGenerateModal } from "@/components/admin/question-generate-modal";
import { ScopeMenu, ScopeMenuItem } from "@/components/admin/scope-menu";
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

async function getQuestions({
  selectedTrackId,
  selectedVersionId,
  trackIds,
}: {
  selectedTrackId?: string | null;
  selectedVersionId?: string | null;
  trackIds?: string[] | null;
}) {
  return prisma.question.findMany({
    where: selectedVersionId
      ? { versionId: selectedVersionId }
      : selectedTrackId
        ? { trackId: selectedTrackId }
        : trackIds
          ? { trackId: { in: trackIds } }
          : undefined,
    orderBy: [
      { isActive: "desc" },
      { trackRef: { order: "asc" } },
      { track: "asc" },
      { order: "asc" },
      { createdAt: "asc" },
    ],
    select: {
      id: true,
      type: true,
      track: true,
      trackId: true,
      gradeId: true,
      versionId: true,
      text: true,
      textUz: true,
      explanation: true,
      isActive: true,
      order: true,
      apiConfig: true,
      createdAt: true,
      trackRef: { select: { id: true, slug: true, name: true } },
      options: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          label: true,
          text: true,
          textUz: true,
          isCorrect: true,
          order: true,
        },
      },
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

function filterUrl(
  locale: string,
  type: QuestionType,
  track: string,
  extra?: { grade?: string; version?: string },
) {
  const params = new URLSearchParams({ type, track });
  if (extra?.grade) params.set("grade", extra.grade);
  if (extra?.version) params.set("version", extra.version);
  return `/${locale}/admin/questions?${params.toString()}`;
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
          {question.textUz ? (
            <p className="body-2 muted m-0">
              <strong>{t("translation.uz")}:</strong> {question.textUz}
            </p>
          ) : null}
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
                      {option.textUz ? (
                        <span className="muted"> · {option.textUz}</span>
                      ) : null}
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
            <QuestionToggleButton
              questionId={question.id}
              questionText={question.text}
              isActive={question.isActive}
            />
            <QuestionDeleteForm
              questionId={question.id}
              questionText={question.text}
            />
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
  searchParams: Promise<{
    type?: string;
    track?: string;
    grade?: string;
    version?: string;
    created?: string;
    added?: string;
  }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("AdminQuestions");
  const profile = await requireAdminAccess({ locale });
  const manageableTrackIds = await getManageableTrackIds(profile);
  const resolvedSearchParams = await searchParams;
  const allTracks = await ensureTracks();
  const tracks = manageableTrackIds
    ? allTracks.filter((track) => manageableTrackIds.includes(track.id))
    : allTracks;
  if (tracks.length === 0) {
    redirect(`/${locale}/admin/tracks`);
  }

  // A track is always selected. Without one there is no grade and no version
  // to scope by, which left import, generation and the whole path bar with
  // nothing to point at — and "add" silently guessing a target.
  const requestedTrack = resolvedSearchParams.track;
  const requestedTrackRecord = tracks.find(
    (track) => track.slug === requestedTrack,
  );
  const selectedTrackRecord = requestedTrackRecord ?? tracks[0];

  if (!requestedTrack || requestedTrack !== selectedTrackRecord.slug) {
    redirect(`/${locale}/admin/questions?track=${selectedTrackRecord.slug}`);
  }

  const selectedTrackSlug = selectedTrackRecord.slug;

  const gradesForTrack = await prisma.grade.findMany({
    where: { trackId: selectedTrackRecord.id },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: {
      versions: {
        orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
        include: { _count: { select: { questions: true } } },
      },
    },
  });
  const requestedGradeSlug = resolvedSearchParams.grade;
  const selectedGradeRecord =
    gradesForTrack.find((grade) => grade.slug === requestedGradeSlug) ??
    gradesForTrack[0] ??
    null;
  const versionsForGrade = selectedGradeRecord?.versions ?? [];
  const requestedVersionId = resolvedSearchParams.version;
  const selectedVersionRecord =
    versionsForGrade.find((version) => version.id === requestedVersionId) ??
    versionsForGrade.find((version) => version.isActive) ??
    versionsForGrade[0] ??
    null;

  const [questions, questionCountsByTrack] = await Promise.all([
    getQuestions({
      selectedTrackId: selectedTrackRecord.id,
      selectedVersionId: selectedVersionRecord?.id,
      trackIds: manageableTrackIds,
    }),
    prisma.question.groupBy({
      by: ["trackId"],
      where: manageableTrackIds
        ? { trackId: { in: manageableTrackIds } }
        : undefined,
      _count: { _all: true },
    }),
  ]);
  const requestedType =
    resolvedSearchParams.type === "API_SANDBOX" ||
    resolvedSearchParams.type === "SQL_SANDBOX" ||
    resolvedSearchParams.type === "DEVTOOLS_SANDBOX" ||
    resolvedSearchParams.type === "MANUAL_QA_SANDBOX" ||
    resolvedSearchParams.type === "AUTOTEST_SANDBOX" ||
    resolvedSearchParams.type === "QUIZ"
      ? resolvedSearchParams.type
      : "QUIZ";
  const selectedType = isQuestionTypeAllowedForTrack(
    requestedType,
    selectedTrackRecord.slug,
  )
    ? requestedType
    : "QUIZ";
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
      questionCountsByTrack.find((item) => item.trackId === track.id)?._count
        ._all ?? 0,
    ]),
  ) as Record<string, number>;
  const parsedAddedCount = Number(resolvedSearchParams.added);
  const addedQuestionCount = Number.isFinite(parsedAddedCount)
    ? Math.max(0, Math.trunc(parsedAddedCount))
    : 0;
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
      {addedQuestionCount > 0 ? (
        <QuestionCreatedToast count={addedQuestionCount} />
      ) : null}
      <div className="page-header">
        <div>
          <h1 className="head-1">{t("title")}</h1>
          <p className="body-1 muted m-0">
            {selectedTrackRecord.name} · {t("description")}
          </p>
        </div>
      </div>

      <section className="surface question-bank-layout">
        <div className="question-scope-bar">
          <div className="question-scope-path">
          <ScopeMenu
            ariaLabel={`Трек: ${selectedTrackRecord.name}`}
            label={selectedTrackRecord.name}
          >
            {tracks.map((track) => {
              const meta = getQuestionTrackMeta(track);
              const active = selectedTrackRecord.id === track.id;

              return (
                <ScopeMenuItem key={track.id}>
                  <Link
                    className={`scope-menu-item ${active ? "active" : ""} ${track.isActive ? "" : "muted-track"}`}
                    href={filterUrl(locale, activeSection.type, track.slug)}
                  >
                    <span className="nav-row">
                      <span className={meta.dotClassName} />
                      {meta.label}
                    </span>
                    <span className="scope-menu-count">
                      {trackCounts[track.id] ?? 0}
                    </span>
                  </Link>
                </ScopeMenuItem>
              );
            })}
          </ScopeMenu>

          {gradesForTrack.length > 0 ? (
            <>
              <span aria-hidden="true" className="question-scope-separator">
                ›
              </span>
              <ScopeMenu
                ariaLabel={`Грейд: ${selectedGradeRecord?.name ?? "—"}`}
                label={selectedGradeRecord?.name ?? "—"}
              >
                {gradesForTrack.map((grade) => (
                  <ScopeMenuItem key={grade.id}>
                    <Link
                      className={`scope-menu-item ${grade.id === selectedGradeRecord?.id ? "active" : ""}`}
                      href={filterUrl(
                        locale,
                        activeSection.type,
                        selectedTrackSlug,
                        { grade: grade.slug },
                      )}
                    >
                      <span>{grade.name}</span>
                    </Link>
                  </ScopeMenuItem>
                ))}
              </ScopeMenu>
            </>
          ) : null}

          {selectedGradeRecord && selectedVersionRecord ? (
            <>
              <span aria-hidden="true" className="question-scope-separator">
                ›
              </span>
              <ScopeMenu
                ariaLabel={`Версия: ${selectedVersionRecord.name}`}
                label={
                  <>
                    {selectedVersionRecord.name}
                    <Badge
                      variant={
                        selectedVersionRecord.isActive ? "success" : "muted"
                      }
                    >
                      {selectedVersionRecord.isActive ? "активна" : "черновик"}
                    </Badge>
                  </>
                }
              >
                {versionsForGrade.map((version) => (
                  <ScopeMenuItem key={version.id}>
                    <Link
                      className={`scope-menu-item ${version.id === selectedVersionRecord.id ? "active" : ""}`}
                      href={filterUrl(
                        locale,
                        activeSection.type,
                        selectedTrackSlug,
                        { grade: selectedGradeRecord.slug, version: version.id },
                      )}
                    >
                      <span>{version.name}</span>
                      <Badge variant={version.isActive ? "success" : "muted"}>
                        {version.isActive ? "активна" : "черновик"}
                      </Badge>
                    </Link>
                  </ScopeMenuItem>
                ))}
                <div className="scope-menu-divider" />
                <form action={createQuestionVersionAction}>
                  <input
                    type="hidden"
                    name="gradeId"
                    value={selectedGradeRecord.id}
                  />
                  <ScopeMenuItem>
                    <button className="scope-menu-item" type="submit">
                      <span className="nav-row">
                        <Plus size={14} />
                        Новая версия
                      </span>
                    </button>
                  </ScopeMenuItem>
                </form>
              </ScopeMenu>

              <ScopeMenu ariaLabel="Действия над версией" icon={<MoreHorizontal size={16} />}>
                {!selectedVersionRecord.isActive ? (
                  <form action={activateQuestionVersionAction}>
                    <input
                      type="hidden"
                      name="versionId"
                      value={selectedVersionRecord.id}
                    />
                    <ScopeMenuItem>
                      <button className="scope-menu-item" type="submit">
                        Активировать
                      </button>
                    </ScopeMenuItem>
                  </form>
                ) : null}
                <form action={duplicateQuestionVersionAction}>
                  <input
                    type="hidden"
                    name="versionId"
                    value={selectedVersionRecord.id}
                  />
                  <ScopeMenuItem>
                    <button className="scope-menu-item" type="submit">
                      Дублировать
                    </button>
                  </ScopeMenuItem>
                </form>
                {!selectedVersionRecord.isActive ? (
                  <>
                    <div className="scope-menu-divider" />
                    <form action={deleteQuestionVersionAction}>
                      <input
                        type="hidden"
                        name="versionId"
                        value={selectedVersionRecord.id}
                      />
                      <ScopeMenuItem>
                        <button
                          className="scope-menu-item destructive"
                          type="submit"
                        >
                          Удалить версию
                        </button>
                      </ScopeMenuItem>
                    </form>
                  </>
                ) : null}
              </ScopeMenu>
            </>
          ) : null}

            {gradesForTrack.length === 0 ? (
              <span className="body-2 muted">
                Грейды не созданы — добавьте их на странице «Треки».
              </span>
            ) : null}
          </div>
        </div>

        <div className="question-list-panel">
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
                  <Link
                    href={filterUrl(locale, type, selectedTrackSlug, {
                      grade: selectedGradeRecord?.slug,
                      version: selectedVersionRecord?.id,
                    })}
                  >
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
            {/* Import and generation only produce Quiz questions, so they live
                next to the type they apply to instead of the scope bar. */}
            {/* No count badge here: the type tab right above already shows it. */}
            <div className="nav-row">
              {activeSection.type === "QUIZ" &&
              selectedGradeRecord &&
              selectedVersionRecord ? (
                <>
                  <QuestionImportModal
                    gradeId={selectedGradeRecord.id}
                    gradeName={selectedGradeRecord.name}
                    trackId={selectedTrackRecord.id}
                    versionId={selectedVersionRecord.id}
                    versionName={selectedVersionRecord.name}
                  />
                  <QuestionGenerateModal
                    gradeId={selectedGradeRecord.id}
                    gradeName={selectedGradeRecord.name}
                    trackId={selectedTrackRecord.id}
                    versionId={selectedVersionRecord.id}
                    versionName={selectedVersionRecord.name}
                  />
                </>
              ) : null}
              <QuestionCreateModal
                initialType={activeSection.type}
                initialTrackId={selectedTrackRecord.id}
                initialGradeId={selectedGradeRecord?.id}
                initialVersionId={selectedVersionRecord?.id}
                tracks={tracksForForms}
              />
            </div>
          </div>

          {activeSection.items.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon" aria-hidden="true">
                <Inbox size={22} />
              </span>
              <p className="empty-state-title">{t("empty")}</p>
              <p className="empty-state-hint">{t("emptyHint")}</p>
            </div>
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
