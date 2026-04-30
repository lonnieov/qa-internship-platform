import { notFound } from "next/navigation";
import { Clock3, Route, TimerReset } from "lucide-react";
import { stringifyPrettyJson } from "@/lib/api-sandbox";
import { getOpenQuizConfig } from "@/lib/open-quiz";
import { prisma } from "@/lib/prisma";
import { formatDuration, formatPercent } from "@/lib/utils";
import { ReportPrintButton } from "@/components/admin/report-print-button";
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
          (attempt.submittedAt?.getTime() ?? Date.now()) - attempt.startedAt.getTime(),
        );
  const averageQuestionTimeMs =
    attempt.questionCount > 0 ? Math.round(answerTimeMs / attempt.questionCount) : 0;

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
          <ReportPrintButton />
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
                      {answer.question.type === "API_SANDBOX" ||
                      answer.question.type === "DEVTOOLS_SANDBOX" ? (
                        <div className="stack">
                          <strong>
                            {answer.apiResponse && typeof answer.apiResponse === "object"
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
                      ) : getOpenQuizConfig(answer.question.apiConfig) ? (
                        (
                          answer.apiRequest as
                            | { answerText?: string }
                            | null
                            | undefined
                        )?.answerText ?? "не заполнен"
                      ) : (
                        answer.selectedOption?.text ?? "не выбран"
                      )}
                    </td>
                    <td>{formatDuration(answer.timeSpentMs)}</td>
                    <td>
                      <Badge variant={answer.isCorrect ? "success" : "danger"}>
                        {answer.isCorrect ? "верно" : "0 баллов"}
                      </Badge>
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
