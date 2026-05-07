import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CheckCircle2, Clock3, UsersRound } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/assessment";
import { formatPercent } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getManageableTrackIds, requireAdminAccess } from "@/lib/auth";

function formatDateTime(value: Date | null | undefined, locale: "ru" | "uz") {
  if (!value) return "--";

  return value.toLocaleString(locale === "uz" ? "uz-UZ" : "ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: "ru" | "uz" }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("AdminOverview");
  const profile = await requireAdminAccess();
  const manageableTrackIds = await getManageableTrackIds(profile);
  const trackWhere = manageableTrackIds ? { trackId: { in: manageableTrackIds } } : {};
  const [settings, internCount, activeQuestionCount, attempts] =
    await Promise.all([
      getSettings(),
      prisma.internProfile.count({ where: trackWhere }),
      prisma.question.count({ where: { isActive: true, ...trackWhere } }),
      prisma.assessmentAttempt.findMany({
        where: trackWhere,
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
          <h1 className="head-1">{t("title")}</h1>
          <p className="body-1 muted m-0">
            {t("description")}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/interns">{t("grantAccess")}</Link>
        </Button>
      </div>

      <section className="grid-3">
        <Card>
          <CardHeader>
            <UsersRound color="var(--primary)" />
            <CardTitle>{t("cards.interns")}</CardTitle>
          </CardHeader>
          <CardContent className="metric">
            <span className="metric-value">{internCount}</span>
            <Badge>{t("cards.inDatabase")}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CheckCircle2 color="var(--primary)" />
            <CardTitle>{t("cards.activeQuestions")}</CardTitle>
          </CardHeader>
          <CardContent className="metric">
            <span className="metric-value">{activeQuestionCount}</span>
            <Badge variant="success">{t("cards.active")}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Clock3 color="var(--primary)" />
            <CardTitle>{t("cards.timeLimit")}</CardTitle>
          </CardHeader>
          <CardContent className="metric">
            <span className="metric-value">{settings.totalTimeMinutes}</span>
            <Badge variant="muted">{t("cards.minutes")}</Badge>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t("recentAttempts.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("recentAttempts.table.intern")}</th>
                  <th>{t("recentAttempts.table.started")}</th>
                  <th>{t("recentAttempts.table.submitted")}</th>
                  <th>{t("recentAttempts.table.status")}</th>
                  <th>{t("recentAttempts.table.result")}</th>
                  <th>{t("recentAttempts.table.progress")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt) => (
                  <tr key={attempt.id}>
                    <td>{attempt.internProfile.fullName}</td>
                    <td>{formatDateTime(attempt.startedAt, locale)}</td>
                    <td>{formatDateTime(attempt.submittedAt, locale)}</td>
                    <td>
                      <Badge
                        variant={
                          attempt.status === "SUBMITTED" ? "success" : "warning"
                        }
                      >
                        {t(`status.${attempt.status}`)}
                      </Badge>
                    </td>
                    <td>{formatPercent(attempt.scorePercent)}</td>
                    <td>
                      <Progress value={attempt.scorePercent ?? 0} />
                    </td>
                    <td>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/attempts/${attempt.id}`}>
                          {t("recentAttempts.open")}
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
                {attempts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="muted">
                      {t("recentAttempts.empty")}
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
