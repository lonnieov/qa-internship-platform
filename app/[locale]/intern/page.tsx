import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Clock3, HelpCircle } from "lucide-react";
import { getSettings, internQuestionFilter } from "@/lib/assessment";
import { requireIntern } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InternStartPanel } from "@/components/intern/intern-start-panel";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ServiceLogo } from "@/components/service-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { InternName } from "@/components/ui/intern-name";

export default async function InternHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const t = await getTranslations("InternHome");
  const { locale } = await params;
  const profile = await requireIntern({ locale });
  const [
    settings,
    activeQuestionCount,
    latestAttempt,
    inProgress,
    invitation,
    grade,
    track,
  ] = await Promise.all([
      getSettings({
        trackId: profile.internProfile.trackId,
        waveId: profile.internProfile.waveId,
      }),
      // Same filter startAttempt uses, so the advertised count matches the test.
      prisma.question.count({
        where: internQuestionFilter(profile.internProfile),
      }),
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
      profile.internProfile.gradeId
        ? prisma.grade.findUnique({
            where: { id: profile.internProfile.gradeId },
            select: { name: true },
          })
        : null,
      profile.internProfile.trackId
        ? prisma.track.findUnique({
            where: { id: profile.internProfile.trackId },
            select: { name: true },
          })
        : null,
    ]);
  const currentInvitationStatus = invitation?.status;

  if (
    latestAttempt &&
    latestAttempt.status !== "IN_PROGRESS" &&
    currentInvitationStatus === "COMPLETED"
  ) {
    redirect(`/${locale}/intern/finish?attempt=${latestAttempt.id}`);
  }

  // Falls back to the generic role label when the intern predates tracks/grades.
  const candidateScope =
    [track?.name, grade?.name].filter(Boolean).join(" · ") ||
    t("candidateRole");

  const initials = profile.internProfile.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <main className="page intern-assessment-page">
      <div className="intern-page-top">
        <div className="brand">
          <ServiceLogo href={`/${locale}`} />
          QA Assessment
        </div>
        <div className="hero-actions">
          <LanguageSwitcher />
          <ThemeToggle variant="icon" />
        </div>
      </div>

      <section className="intern-assessment-hero">
        <div>
          <span className="intern-eyebrow">
            <span />
            {t("sessionActive")}
          </span>
          <h1>{t("welcome", { name: profile.internProfile.fullName })}</h1>
          <p>{t("description")}</p>
        </div>
        <div className="intern-candidate-card" aria-label="Профиль кандидата">
          <div className="intern-avatar">{initials || "QA"}</div>
          <div>
            <InternName name={profile.internProfile.fullName} />
            <span>{candidateScope}</span>
          </div>
        </div>
      </section>

      <section className="intern-stat-grid" aria-label={t("testParams")}>
        <div className="intern-stat-card">
          <div>
            <span>{t("questions")}</span>
            <div className="intern-stat-icon">
              <HelpCircle size={14} />
            </div>
          </div>
          <strong>{activeQuestionCount}</strong>
          <p>
            <span>{t("oneCorrect")}</span>
            <Badge>{t("active")}</Badge>
          </p>
        </div>
        <div className="intern-stat-card">
          <div>
            <span>{t("time")}</span>
            <div className="intern-stat-icon">
              <Clock3 size={14} />
            </div>
          </div>
          <strong>{settings.totalTimeMinutes}</strong>
          <p>
            <span>{t("totalLimit")}</span>
            <Badge variant="muted">{t("minutes")}</Badge>
          </p>
        </div>
      </section>

      <InternStartPanel
        hasActiveAttempt={Boolean(inProgress)}
        hasActiveQuestions={activeQuestionCount > 0}
      />
    </main>
  );
}
