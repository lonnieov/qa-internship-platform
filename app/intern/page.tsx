import Link from "next/link";
import { redirect } from "next/navigation";
import { startAttemptAction } from "@/actions/intern";
import { getSettings } from "@/lib/assessment";
import { requireIntern } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPercent } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default async function InternHomePage() {
  const profile = await requireIntern();
  const [settings, activeQuestionCount, attempts, inProgress] = await Promise.all([
    getSettings(),
    prisma.question.count({ where: { isActive: true } }),
    prisma.assessmentAttempt.findMany({
      where: { internProfileId: profile.internProfile.id },
      orderBy: { startedAt: "desc" },
      take: 5,
    }),
    prisma.assessmentAttempt.findFirst({
      where: {
        internProfileId: profile.internProfile.id,
        status: "IN_PROGRESS",
      },
      orderBy: { startedAt: "desc" },
    }),
  ]);

  const latest = attempts[0];

  if (latest && latest.status !== "IN_PROGRESS") {
    redirect(`/intern/finish?attempt=${latest.id}`);
  }

  return (
    <main className="page stack-lg">
      <div className="page-header">
        <div>
          <h1 className="head-1">Добро пожаловать, {profile.internProfile.fullName}</h1>
          <p className="body-1 muted m-0">
            Тест закрытого типа. Для прохождения нужен результат 100%.
          </p>
        </div>
        {inProgress ? (
          <Button asChild>
            <Link href={`/intern/test?attempt=${inProgress.id}`}>Продолжить</Link>
          </Button>
        ) : (
          <form action={startAttemptAction}>
            <Button type="submit" disabled={activeQuestionCount === 0}>
              Старт
            </Button>
          </form>
        )}
      </div>

      <section className="grid-3">
        <Card>
          <CardHeader>
            <CardTitle>Вопросов</CardTitle>
          </CardHeader>
          <CardContent className="metric">
            <span className="metric-value">{activeQuestionCount}</span>
            <Badge>активно</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Время</CardTitle>
          </CardHeader>
          <CardContent className="metric">
            <span className="metric-value">{settings.totalTimeMinutes}</span>
            <Badge variant="muted">минут</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Последний результат</CardTitle>
          </CardHeader>
          <CardContent className="stack">
            <span className="metric-value">{formatPercent(latest?.scorePercent)}</span>
            <Progress value={latest?.scorePercent ?? 0} />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>История попыток</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Статус</th>
                  <th>Результат</th>
                  <th>Верно</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt) => (
                  <tr key={attempt.id}>
                    <td>{attempt.startedAt.toLocaleString("ru-RU")}</td>
                    <td>
                      <Badge variant={attempt.status === "SUBMITTED" ? "success" : "warning"}>
                        {attempt.status}
                      </Badge>
                    </td>
                    <td>{formatPercent(attempt.scorePercent)}</td>
                    <td>
                      {attempt.correctCount}/{attempt.questionCount}
                    </td>
                  </tr>
                ))}
                {attempts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="muted">
                      Попыток ещё нет.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
