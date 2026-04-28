import { redirect } from "next/navigation";
import { Award, LockKeyhole } from "lucide-react";
import { getResultAttemptId, verifyResultTicket } from "@/lib/intern-token-auth";
import { prisma } from "@/lib/prisma";
import { formatPercent } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default async function InternResultPage({
  searchParams,
}: {
  searchParams: Promise<{ ticket?: string }>;
}) {
  const { ticket } = await searchParams;
  const attemptId = verifyResultTicket(ticket) ?? (await getResultAttemptId());

  if (!attemptId) {
    redirect("/sign-in/intern");
  }

  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      internProfile: true,
    },
  });

  if (!attempt || attempt.status === "IN_PROGRESS") {
    redirect("/sign-in/intern");
  }

  const score = attempt.scorePercent ?? 0;

  return (
    <main className="page page-narrow stack-lg">
      <div className="page-header">
        <div>
          <h1 className="head-1">Результат тестирования</h1>
          <p className="body-1 muted m-0">{attempt.internProfile.fullName}</p>
        </div>
        <Badge variant={score >= 100 ? "success" : "danger"}>
          {score >= 100 ? "пройдено" : "не пройдено"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <Award color="var(--primary)" />
          <CardTitle>Итоговый процент</CardTitle>
        </CardHeader>
        <CardContent className="stack">
          <span className="metric-value">{formatPercent(score)}</span>
          <Progress value={score} />
          <p className="body-1 muted m-0">
            Верных ответов: {attempt.correctCount} из {attempt.questionCount}.
            Проходной балл для этого ассессмента — 100%.
          </p>
        </CardContent>
      </Card>

      <div className="soft-panel nav-row">
        <LockKeyhole size={18} color="var(--destructive)" />
        <strong>Доступ по токену аннулирован.</strong>
        <span className="body-2 muted">
          Повторный вход и повторная попытка недоступны.
        </span>
      </div>
    </main>
  );
}
