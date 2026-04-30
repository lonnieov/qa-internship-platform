import Link from "next/link";
import { redirect } from "next/navigation";
import { startAttemptAction } from "@/actions/intern";
import { getSettings } from "@/lib/assessment";
import { requireIntern } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function InternHomePage() {
  const profile = await requireIntern();
  const [settings, activeQuestionCount, latestAttempt, inProgress, invitation] =
    await Promise.all([
      getSettings(),
      prisma.question.count({ where: { isActive: true } }),
      prisma.assessmentAttempt.findFirst({
        where: { internProfileId: profile.internProfile.id },
        orderBy: { startedAt: "desc" },
      }),
      prisma.assessmentAttempt.findFirst({
        where: {
          internProfileId: profile.internProfile.id,
          status: "IN_PROGRESS",
        },
        orderBy: { startedAt: "desc" },
      }),
      profile.internProfile.invitationId
        ? prisma.invitation.findUnique({
            where: { id: profile.internProfile.invitationId },
            select: { status: true },
          })
        : null,
    ]);
  const currentInvitationStatus = invitation?.status;

  if (
    latestAttempt &&
    latestAttempt.status !== "IN_PROGRESS" &&
    currentInvitationStatus === "COMPLETED"
  ) {
    redirect(`/intern/finish?attempt=${latestAttempt.id}`);
  }

  return (
    <main className="page stack-lg">
      <div className="page-header">
        <div>
          <h1 className="head-1">Добро пожаловать, {profile.internProfile.fullName}</h1>
        </div>
      </div>

      <section className="grid-2">
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
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Готовы начать?</CardTitle>
        </CardHeader>
        <CardContent className="stack">
          <p className="body-1 muted m-0">
            После запуска начнётся отсчёт общего времени на прохождение теста.
          </p>
          {inProgress ? (
            <Button asChild>
              <Link href={`/intern/test?attempt=${inProgress.id}`}>Продолжить тестирование</Link>
            </Button>
          ) : (
            <form action={startAttemptAction}>
              <Button type="submit" disabled={activeQuestionCount === 0}>
                Начать тестирование
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
