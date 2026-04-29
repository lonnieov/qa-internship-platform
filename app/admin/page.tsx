import Link from "next/link";
import { CheckCircle2, Clock3, UsersRound } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/assessment";
import { formatPercent } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "--";

  return value.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminPage() {
  const [settings, internCount, activeQuestionCount, attempts] =
    await Promise.all([
      getSettings(),
      prisma.internProfile.count(),
      prisma.question.count({ where: { isActive: true } }),
      prisma.assessmentAttempt.findMany({
        orderBy: { startedAt: "desc" },
        take: 6,
        include: {
          internProfile: {
            include: { profile: true },
          },
        },
      }),
    ]);

  return (
    <main className="page stack-lg">
      <div className="page-header">
        <div>
          <h1 className="head-1">Панель администратора</h1>
          <p className="body-1 muted m-0">
            Управляйте доступом, вопросами и результатами стажёров.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/interns">Выдать доступ</Link>
        </Button>
      </div>

      <section className="grid-3">
        <Card>
          <CardHeader>
            <UsersRound color="var(--primary)" />
            <CardTitle>Стажёры</CardTitle>
          </CardHeader>
          <CardContent className="metric">
            <span className="metric-value">{internCount}</span>
            <Badge>в базе</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CheckCircle2 color="var(--primary)" />
            <CardTitle>Активные вопросы</CardTitle>
          </CardHeader>
          <CardContent className="metric">
            <span className="metric-value">{activeQuestionCount}</span>
            <Badge variant="success">активно</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Clock3 color="var(--primary)" />
            <CardTitle>Лимит времени</CardTitle>
          </CardHeader>
          <CardContent className="metric">
            <span className="metric-value">{settings.totalTimeMinutes}</span>
            <Badge variant="muted">минут</Badge>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Последние попытки</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Стажёр</th>
                  <th>Начал тест</th>
                  <th>Прошёл тест</th>
                  <th>Статус</th>
                  <th>Результат</th>
                  <th>Прогресс</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt) => (
                  <tr key={attempt.id}>
                    <td>{attempt.internProfile.fullName}</td>
                    <td>{formatDateTime(attempt.startedAt)}</td>
                    <td>{formatDateTime(attempt.submittedAt)}</td>
                    <td>
                      <Badge
                        variant={
                          attempt.status === "SUBMITTED" ? "success" : "warning"
                        }
                      >
                        {attempt.status}
                      </Badge>
                    </td>
                    <td>{formatPercent(attempt.scorePercent)}</td>
                    <td>
                      <Progress value={attempt.scorePercent ?? 0} />
                    </td>
                    <td>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/attempts/${attempt.id}`}>
                          Открыть
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
                {attempts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="muted">
                      Пока нет попыток.
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
