import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDuration, formatPercent } from "@/lib/utils";
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
      events: {
        orderBy: { occurredAt: "desc" },
        take: 250,
        include: { question: true },
      },
    },
  });

  if (!attempt) notFound();

  return (
    <main className="page stack-lg">
      <div className="page-header">
        <div>
          <h1 className="head-1">{attempt.internProfile.fullName}</h1>
          <p className="body-1 muted m-0">Вход по токену без email</p>
        </div>
        <Badge variant={(attempt.scorePercent ?? 0) >= 100 ? "success" : "danger"}>
          {formatPercent(attempt.scorePercent)}
        </Badge>
      </div>

      <section className="grid-3">
        <Card>
          <CardHeader>
            <CardTitle>Статус</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={attempt.status === "SUBMITTED" ? "success" : "warning"}>
              {attempt.status}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Верно</CardTitle>
          </CardHeader>
          <CardContent className="metric">
            <span className="metric-value">
              {attempt.correctCount}/{attempt.questionCount}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Время</CardTitle>
          </CardHeader>
          <CardContent className="metric">
            <span className="metric-value">{attempt.totalTimeSeconds ?? 0}</span>
            <Badge variant="muted">сек</Badge>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Ответы</CardTitle>
        </CardHeader>
        <CardContent className="stack">
          <Progress value={attempt.scorePercent ?? 0} />
          {attempt.answers.map((answer, index) => {
            const correctOption = answer.question.options.find((option) => option.isCorrect);
            return (
              <div className="soft-panel stack" key={answer.id}>
                <div className="metric">
                  <strong>
                    {index + 1}. {answer.question.text}
                  </strong>
                  <Badge variant={answer.isCorrect ? "success" : "danger"}>
                    {answer.isCorrect ? "верно" : "0 баллов"}
                  </Badge>
                </div>
                <p className="body-2 m-0">
                  Ответ: {answer.selectedOption?.text ?? "не выбран"}
                </p>
                <p className="body-2 muted m-0">
                  Правильно: {correctOption?.text ?? "не задано"}; время на вопрос:{" "}
                  {formatDuration(answer.timeSpentMs)}; визитов: {answer.visits}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Лог поведения</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="event-list">
            <table className="table">
              <thead>
                <tr>
                  <th>Время</th>
                  <th>Событие</th>
                  <th>Вопрос</th>
                  <th>Координаты</th>
                  <th>Target</th>
                </tr>
              </thead>
              <tbody>
                {attempt.events.map((event) => (
                  <tr key={event.id}>
                    <td>{event.occurredAt.toLocaleTimeString("ru-RU")}</td>
                    <td>{event.type}</td>
                    <td>{event.question?.text ?? "-"}</td>
                    <td>
                      {event.x === null || event.y === null
                        ? "-"
                        : `${event.x}, ${event.y}`}
                    </td>
                    <td>{event.target ?? "-"}</td>
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
