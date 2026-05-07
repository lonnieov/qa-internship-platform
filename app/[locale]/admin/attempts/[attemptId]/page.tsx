import { Fragment } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ChevronDown, Clock3, Route, TimerReset } from "lucide-react";
import {
  getAiAnswerReview,
  isAiReviewableAnswer,
} from "@/lib/ai-answer-review";
import { getInternComment } from "@/lib/answer-comment";
import { stringifyPrettyJson } from "@/lib/api-sandbox";
import {
  getManualQaAnswerPayload,
  getManualQaSandboxConfig,
} from "@/lib/manual-qa-sandbox";
import {
  getAutotestAnswerPayload,
  getAutotestSandboxConfig,
} from "@/lib/autotest-sandbox";
import { getOpenQuizConfig } from "@/lib/open-quiz";
import { prisma } from "@/lib/prisma";
import { formatDuration, formatPercent } from "@/lib/utils";
import { AnswerReviewForm } from "@/components/admin/answer-review-form";
import { AnswerAiReviewCard } from "@/components/admin/answer-ai-review-card";
import { AttemptAiReviewsLoader } from "@/components/admin/attempt-ai-reviews-loader";
import { AiOverviewButton } from "@/components/admin/ai-overview-button";
import { ReportDownloadButton } from "@/components/admin/report-download-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getManageableTrackIds, requireAdminAccess } from "@/lib/auth";

export default async function AttemptDetailsPage({
  params,
}: {
  params: Promise<{ locale: "ru" | "uz"; attemptId: string }>;
}) {
  const { attemptId } = await params;
  const t = await getTranslations("AdminAttemptReport");
  const profile = await requireAdminAccess();
  const manageableTrackIds = await getManageableTrackIds(profile);
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      internProfile: { include: { profile: true } },
      answers: {
        include: {
          question: { include: { options: { orderBy: { order: "asc" } } } },
          selectedOption: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!attempt) notFound();
  if (
    manageableTrackIds &&
    (!attempt.trackId || !manageableTrackIds.includes(attempt.trackId))
  ) {
    notFound();
  }
  const safeAttempt = attempt;

  const score = safeAttempt.scorePercent ?? 0;
  const answerTimeMs = safeAttempt.answers.reduce(
    (sum, answer) => sum + answer.timeSpentMs,
    0,
  );
  const totalTimeMs =
    typeof safeAttempt.totalTimeSeconds === "number"
      ? safeAttempt.totalTimeSeconds * 1000
      : Math.max(
          0,
          (safeAttempt.submittedAt?.getTime() ?? Date.now()) -
            safeAttempt.startedAt.getTime(),
        );
  const averageQuestionTimeMs =
    safeAttempt.questionCount > 0
      ? Math.round(answerTimeMs / safeAttempt.questionCount)
      : 0;

  function formatAttemptStatus(status: typeof safeAttempt.status) {
    return t(`status.${status}`);
  }

  function getAdminReview(answer: (typeof safeAttempt.answers)[number]) {
    if (
      answer.apiResponse &&
      typeof answer.apiResponse === "object" &&
      !Array.isArray(answer.apiResponse)
    ) {
      const r = (answer.apiResponse as Record<string, unknown>).adminReview;
      if (r && typeof r === "object" && !Array.isArray(r)) {
        return r as { passed: boolean; note: string; at: string };
      }
    }
    return null;
  }

  function isManualReviewAnswer(answer: (typeof safeAttempt.answers)[number]) {
    return isAiReviewableAnswer(answer);
  }

  function formatQuestionResult(answer: (typeof safeAttempt.answers)[number]) {
    if (isManualReviewAnswer(answer)) {
      const review = getAdminReview(answer);
      if (!review) return t("table.resultManual");
      return review.passed ? t("table.resultCorrect") : t("table.resultWrong");
    }

    return answer.isCorrect ? t("table.resultCorrect") : t("table.resultWrong");
  }

  const missingAiReviewCount = safeAttempt.answers.filter(
    (answer) =>
      isManualReviewAnswer(answer) && !getAiAnswerReview(answer.apiResponse),
  ).length;

  return (
    <main className="page stack-lg report-print-area">
      <div className="page-header">
        <div>
          <h1 className="head-1">{t("title")}</h1>
          <p className="body-1 muted m-0">
            {t("subtitle", { name: attempt.internProfile.fullName })}
          </p>
        </div>
        <div className="nav-row">
          <Badge variant={score >= 100 ? "success" : "danger"}>
            {formatPercent(score)}
          </Badge>
          <AiOverviewButton attemptId={safeAttempt.id} />
          <ReportDownloadButton attemptId={safeAttempt.id} />
        </div>
      </div>

      <AttemptAiReviewsLoader
        attemptId={safeAttempt.id}
        missingCount={missingAiReviewCount}
      />

      <section className="grid-2">
        <Card>
          <CardHeader>
            <Clock3 color="var(--primary)" />
            <CardTitle>{t("summary.totalTime")}</CardTitle>
          </CardHeader>
          <CardContent className="metric">
            <span className="metric-value">{formatDuration(totalTimeMs)}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <TimerReset color="var(--accent)" />
            <CardTitle>{t("summary.averageTime")}</CardTitle>
          </CardHeader>
          <CardContent className="metric">
            <span className="metric-value">
              {formatDuration(averageQuestionTimeMs)}
            </span>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t("summary.result")}</CardTitle>
        </CardHeader>
        <CardContent className="stack">
          <Progress value={score} />
          <div className="report-summary-grid">
            <div>
              <span className="body-2 muted">{t("summary.status")}</span>
              <strong>{formatAttemptStatus(safeAttempt.status)}</strong>
            </div>
            <div>
              <span className="body-2 muted">
                {t("summary.correctAnswers")}
              </span>
              <strong>
                {safeAttempt.correctCount}/{safeAttempt.questionCount}
              </strong>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Route color="var(--primary)" />
          <CardTitle>{t("table.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="table-wrap">
            <table className="table attempt-answers-table">
              <colgroup>
                <col className="attempt-col-question" />
                <col className="attempt-col-answer" />
                <col className="attempt-col-time" />
                <col className="attempt-col-result" />
              </colgroup>
              <thead>
                <tr>
                  <th>{t("table.question")}</th>
                  <th>{t("table.answer")}</th>
                  <th>{t("table.time")}</th>
                  <th>{t("table.result")}</th>
                </tr>
              </thead>
              <tbody>
                {safeAttempt.answers.map((answer, index) => (
                  <Fragment key={answer.id}>
                    <tr
                      className={
                        isManualReviewAnswer(answer)
                          ? "attempt-answer-row has-review"
                          : undefined
                      }
                    >
                      <td>
                        <div className="attempt-question-cell">
                          <strong>
                            {index + 1}. {answer.question.text}
                          </strong>
                          {isManualReviewAnswer(answer) ? (
                            <>
                              <input
                                className="attempt-review-toggle"
                                id={`attempt-review-toggle-${answer.id}`}
                                type="checkbox"
                              />
                              <label
                                aria-label={t("table.toggleReviewForQuestion", {
                                  number: index + 1,
                                })}
                                className="attempt-review-toggle-label"
                                htmlFor={`attempt-review-toggle-${answer.id}`}
                              >
                                <span>{t("table.toggleReview")}</span>
                                <ChevronDown size={18} />
                              </label>
                            </>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        {(() => {
                          const internComment = getInternComment(
                            answer.apiRequest,
                          );

                          return (
                            <div className="stack">
                              <div>
                                {answer.question.type ===
                                "MANUAL_QA_SANDBOX" ? (
                                  (() => {
                                    const payload = getManualQaAnswerPayload(
                                      answer.apiRequest,
                                    );
                                    const config = getManualQaSandboxConfig(
                                      answer.question.apiConfig,
                                    );
                                    const summary =
                                      answer.apiResponse &&
                                      typeof answer.apiResponse === "object" &&
                                      !Array.isArray(answer.apiResponse)
                                        ? (answer.apiResponse as {
                                            matchedKnownBugIds?: string[];
                                          })
                                        : null;

                                    if (!payload) {
                                      return t("table.notFilled");
                                    }

                                    return (
                                      <div className="manual-qa-report-summary">
                                        <div className="nav-row">
                                          <Badge variant="muted">
                                            {t("table.bugsCount", {
                                              count: payload.reports.length,
                                            })}
                                          </Badge>
                                          {payload.noBugsFound ? (
                                            <Badge variant="warning">
                                              {t("table.noBugsFound")}
                                            </Badge>
                                          ) : null}
                                          <Badge variant="muted">
                                            {summary?.matchedKnownBugIds
                                              ?.length ?? 0}
                                            /{config?.knownBugs.length ?? 0}{" "}
                                            {t("table.knownBugs")}
                                          </Badge>
                                        </div>
                                        {payload.reports.map(
                                          (report, reportIndex) => (
                                            <div
                                              className="manual-qa-report-result"
                                              key={report.id}
                                            >
                                              <div className="nav-row">
                                                <strong>
                                                  {reportIndex + 1}.{" "}
                                                  {report.title}
                                                </strong>
                                                <Badge variant="muted">
                                                  {report.severity}
                                                </Badge>
                                                <Badge variant="muted">
                                                  {report.category}
                                                </Badge>
                                              </div>
                                              <p className="body-2 m-0">
                                                <strong>
                                                  {t("table.steps")}:
                                                </strong>{" "}
                                                {report.steps}
                                              </p>
                                              <p className="body-2 m-0">
                                                <strong>
                                                  {t("table.actual")}:
                                                </strong>{" "}
                                                {report.actual}
                                              </p>
                                              <p className="body-2 m-0">
                                                <strong>
                                                  {t("table.expected")}:
                                                </strong>{" "}
                                                {report.expected}
                                              </p>
                                              {report.note ? (
                                                <p className="body-2 muted m-0">
                                                  {report.note}
                                                </p>
                                              ) : null}
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    );
                                  })()
                                ) : answer.question.type ===
                                  "AUTOTEST_SANDBOX" ? (
                                  (() => {
                                    const payload = getAutotestAnswerPayload(
                                      answer.apiRequest,
                                    );
                                    const config = getAutotestSandboxConfig(
                                      answer.question.apiConfig,
                                    );
                                    const summary =
                                      answer.apiResponse &&
                                      typeof answer.apiResponse === "object" &&
                                      !Array.isArray(answer.apiResponse)
                                        ? (answer.apiResponse as {
                                            matchedScenarioIds?: string[];
                                            requiredTotal?: number;
                                            requiredMatched?: number;
                                          })
                                        : null;

                                    if (!payload?.code.trim()) {
                                      return (
                                        <span className="body-2 muted">
                                          {t("table.notFilled")}
                                        </span>
                                      );
                                    }

                                    return (
                                      <div className="autotest-report-summary stack">
                                        {summary ? (
                                          <div className="nav-row">
                                            <Badge variant="muted">
                                              сценарии:{" "}
                                              {summary.requiredMatched ?? 0}/
                                              {summary.requiredTotal ?? 0}{" "}
                                              обязательных
                                            </Badge>
                                            <Badge variant="muted">
                                              {summary.matchedScenarioIds
                                                ?.length ?? 0}{" "}
                                              из{" "}
                                              {config?.expectedScenarios
                                                .length ?? 0}{" "}
                                              всего
                                            </Badge>
                                          </div>
                                        ) : null}

                                        {config?.expectedScenarios.map(
                                          (scenario) => {
                                            const matched =
                                              summary?.matchedScenarioIds?.includes(
                                                scenario.id,
                                              ) ?? false;
                                            return (
                                              <div
                                                className="autotest-scenario-row"
                                                key={scenario.id}
                                              >
                                                <Badge
                                                  variant={
                                                    matched
                                                      ? "success"
                                                      : "danger"
                                                  }
                                                >
                                                  {matched ? "✓" : "✗"}
                                                </Badge>
                                                <span className="body-2">
                                                  {scenario.title}
                                                </span>
                                                {scenario.required ? (
                                                  <Badge variant="muted">
                                                    обязательный
                                                  </Badge>
                                                ) : null}
                                                <span className="body-2 muted autotest-scenario-keywords">
                                                  {scenario.matchKeywords.join(
                                                    ", ",
                                                  )}
                                                </span>
                                              </div>
                                            );
                                          },
                                        )}

                                        <details>
                                          <summary
                                            className="body-2 muted"
                                            style={{ cursor: "pointer" }}
                                          >
                                            Код стажёра
                                          </summary>
                                          <pre className="body-2 m-0 whitespace-pre-wrap autotest-code-preview">
                                            {payload.code}
                                          </pre>
                                        </details>
                                      </div>
                                    );
                                  })()
                                ) : answer.question.type === "API_SANDBOX" ||
                                  answer.question.type ===
                                    "DEVTOOLS_SANDBOX" ? (
                                  <div className="stack">
                                    <strong>
                                      {answer.apiResponse &&
                                      typeof answer.apiResponse === "object"
                                        ? `status ${(answer.apiResponse as { status?: number }).status ?? "-"}`
                                        : t("table.apiRequest")}
                                    </strong>
                                    <span className="body-2 muted">
                                      {t("table.submissions", {
                                        count: answer.submissionCount,
                                      })}
                                    </span>
                                    {answer.apiRequest ? (
                                      <pre className="body-2 m-0 whitespace-pre-wrap">
                                        {stringifyPrettyJson(answer.apiRequest)}
                                      </pre>
                                    ) : null}
                                  </div>
                                ) : getOpenQuizConfig(
                                    answer.question.apiConfig,
                                  ) ? (
                                  ((
                                    answer.apiRequest as
                                      | { answerText?: string }
                                      | null
                                      | undefined
                                  )?.answerText ?? t("table.notFilled"))
                                ) : (
                                  (answer.selectedOption?.text ??
                                  t("table.notSelected"))
                                )}
                              </div>
                              {internComment ? (
                                <div className="intern-comment-result">
                                  <strong>{t("table.internComment")}</strong>
                                  <p className="body-2 m-0">{internComment}</p>
                                </div>
                              ) : null}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="attempt-time-cell">
                        {formatDuration(answer.timeSpentMs)}
                      </td>
                      <td>
                        <Badge
                          variant={
                            isManualReviewAnswer(answer)
                              ? getAdminReview(answer) === null
                                ? "warning"
                                : getAdminReview(answer)?.passed
                                  ? "success"
                                  : "danger"
                              : answer.isCorrect
                                ? "success"
                                : "danger"
                          }
                        >
                          {formatQuestionResult(answer)}
                        </Badge>
                      </td>
                    </tr>
                    {isManualReviewAnswer(answer) ? (
                      <tr className="attempt-review-row">
                        <td colSpan={4}>
                          <div className="attempt-review-panel">
                            <div className="attempt-review-context">
                              {t("table.reviewForQuestion", {
                                number: index + 1,
                              })}
                            </div>
                            <div className="attempt-review-strip">
                              <AnswerAiReviewCard
                                review={getAiAnswerReview(answer.apiResponse)}
                              />
                              <AnswerReviewForm
                                answerId={answer.id}
                                existingReview={getAdminReview(answer)}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
