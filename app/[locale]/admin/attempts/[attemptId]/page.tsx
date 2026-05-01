import { notFound } from "next/navigation";
import { Clock3, Route, TimerReset } from "lucide-react";
import { getInternComment } from "@/lib/answer-comment";
import { stringifyPrettyJson } from "@/lib/api-sandbox";
import {
  getManualQaAnswerPayload,
  getManualQaSandboxConfig,
} from "@/lib/manual-qa-sandbox";
import { getOpenQuizConfig } from "@/lib/open-quiz";
import { prisma } from "@/lib/prisma";
import { formatDuration, formatPercent } from "@/lib/utils";
import { ReportDownloadButton } from "@/components/admin/report-download-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default async function AttemptDetailsPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
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

  const score = attempt.scorePercent ?? 0;
  const answerTimeMs = attempt.answers.reduce(
    (sum, answer) => sum + answer.timeSpentMs,
    0,
  );
  const totalTimeMs =
    typeof attempt.totalTimeSeconds === "number"
      ? attempt.totalTimeSeconds * 1000
      : Math.max(
          0,
          (attempt.submittedAt?.getTime() ?? Date.now()) -
            attempt.startedAt.getTime(),
        );
  const averageQuestionTimeMs =
    attempt.questionCount > 0
      ? Math.round(answerTimeMs / attempt.questionCount)
      : 0;

  return (
    <main className="page stack-lg report-print-area">
      <div className="page-header">
        <div>
          <h1 className="head-1">Отчёт по ассессменту</h1>
          <p className="body-1 muted m-0">
            {attempt.internProfile.fullName} · вход по токену без email
          </p>
        </div>
        <div className="nav-row">
          <Badge variant={score >= 100 ? "success" : "danger"}>
            {formatPercent(score)}
          </Badge>
          <ReportDownloadButton attemptId={attempt.id} />
        </div>
      </div>

      <section className="grid-2">
        <Card>
          <CardHeader>
            <Clock3 color="var(--primary)" />
            <CardTitle>Общее время</CardTitle>
          </CardHeader>
          <CardContent className="metric">
            <span className="metric-value">{formatDuration(totalTimeMs)}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <TimerReset color="var(--accent)" />
            <CardTitle>Среднее на вопрос</CardTitle>
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
          <CardTitle>Итог</CardTitle>
        </CardHeader>
        <CardContent className="stack">
          <Progress value={score} />
          <div className="report-summary-grid">
            <div>
              <span className="body-2 muted">Статус</span>
              <strong>{attempt.status}</strong>
            </div>
            <div>
              <span className="body-2 muted">Верные ответы</span>
              <strong>
                {attempt.correctCount}/{attempt.questionCount}
              </strong>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Route color="var(--primary)" />
          <CardTitle>Время по вопросам</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Вопрос</th>
                  <th>Ответ</th>
                  <th>Время</th>
                  <th>Результат</th>
                </tr>
              </thead>
              <tbody>
                {attempt.answers.map((answer, index) => (
                  <tr key={answer.id}>
                    <td>
                      <strong>
                        {index + 1}. {answer.question.text}
                      </strong>
                    </td>
                    <td>
                      {(() => {
                        const internComment = getInternComment(
                          answer.apiRequest,
                        );

                        return (
                          <div className="stack">
                            <div>
                              {answer.question.type === "MANUAL_QA_SANDBOX" ? (
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
                                    return "не заполнен";
                                  }

                                  return (
                                    <div className="manual-qa-report-summary">
                                      <div className="nav-row">
                                        <Badge variant="muted">
                                          {payload.reports.length} багов
                                        </Badge>
                                        {payload.noBugsFound ? (
                                          <Badge variant="warning">
                                            баги не найдены
                                          </Badge>
                                        ) : null}
                                        <Badge variant="muted">
                                          {summary?.matchedKnownBugIds
                                            ?.length ?? 0}
                                          /{config?.knownBugs.length ?? 0} known
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
                                              <strong>Steps:</strong>{" "}
                                              {report.steps}
                                            </p>
                                            <p className="body-2 m-0">
                                              <strong>Actual:</strong>{" "}
                                              {report.actual}
                                            </p>
                                            <p className="body-2 m-0">
                                              <strong>Expected:</strong>{" "}
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
                              ) : answer.question.type === "API_SANDBOX" ||
                                answer.question.type === "DEVTOOLS_SANDBOX" ? (
                                <div className="stack">
                                  <strong>
                                    {answer.apiResponse &&
                                    typeof answer.apiResponse === "object"
                                      ? `status ${(answer.apiResponse as { status?: number }).status ?? "-"}`
                                      : "API request"}
                                  </strong>
                                  <span className="body-2 muted">
                                    отправок: {answer.submissionCount}
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
                                )?.answerText ?? "не заполнен")
                              ) : (
                                (answer.selectedOption?.text ?? "не выбран")
                              )}
                            </div>
                            {internComment ? (
                              <div className="intern-comment-result">
                                <strong>Комментарий стажёра</strong>
                                <p className="body-2 m-0">{internComment}</p>
                              </div>
                            ) : null}
                          </div>
                        );
                      })()}
                    </td>
                    <td>{formatDuration(answer.timeSpentMs)}</td>
                    <td>
                      {answer.question.type === "MANUAL_QA_SANDBOX" ? (
                        <Badge variant="warning">ручная проверка</Badge>
                      ) : getOpenQuizConfig(answer.question.apiConfig) ? (
                        <Badge variant="muted">без оценки</Badge>
                      ) : (
                        <Badge
                          variant={answer.isCorrect ? "success" : "danger"}
                        >
                          {answer.isCorrect ? "верно" : "0 баллов"}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
