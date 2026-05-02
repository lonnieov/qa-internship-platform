import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  Check,
  CheckSquare,
  Clock3,
  Info,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { getResultAttemptId, verifyResultTicket } from "@/lib/intern-token-auth";
import { prisma } from "@/lib/prisma";
import { formatDuration } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ServiceLogo } from "@/components/service-logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function InternResultPage({
  searchParams,
}: {
  searchParams: Promise<{ ticket?: string }>;
}) {
  const t = await getTranslations("InternResult");
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

  const initials = attempt.internProfile.fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  const totalTimeMs =
    typeof attempt.totalTimeSeconds === "number"
      ? attempt.totalTimeSeconds * 1000
      : Math.max(
          0,
          (attempt.submittedAt?.getTime() ?? Date.now()) -
            attempt.startedAt.getTime(),
        );

  return (
    <main className="page intern-finish-page">
      <div className="intern-page-top">
        <div className="brand">
          <ServiceLogo />
          QA Assessment
        </div>
        <div className="hero-actions">
          <LanguageSwitcher />
          <ThemeToggle variant="icon" />
        </div>
      </div>

      <section className="intern-finish-hero">
        <div className="intern-done-mark">
          <Check size={30} />
        </div>
        <h1>{t("title")}</h1>
        <p>{t("description")}</p>
        <div className="intern-candidate-pill">
          <div className="intern-avatar">{initials || "QA"}</div>
          <strong>{attempt.internProfile.fullName}</strong>
        </div>
      </section>

      <section className="intern-result-summary">
        <div>
          <span>
            <CheckSquare size={14} />
            {t("answersSent")}
          </span>
          <strong>
            {attempt.questionCount}
            <small>{t("ofTotal", { total: attempt.questionCount })}</small>
          </strong>
        </div>
        <div>
          <span>
            <Clock3 size={14} />
            {t("timeSpent")}
          </span>
          <strong>{formatDuration(totalTimeMs)}</strong>
        </div>
      </section>

      <section className="intern-info-banner">
        <div>
          <Info size={17} />
        </div>
        <div>
          <h2>{t("laterTitle")}</h2>
          <p>{t("laterDescription")}</p>
        </div>
      </section>

      <section className="intern-locked-banner">
        <div>
          <LockKeyhole size={15} />
        </div>
        <p>
          <strong>{t("tokenRevokedTitle")}</strong>{" "}
          <span>{t("tokenRevokedDescription")}</span>
        </p>
      </section>

      <section className="intern-next-steps">
        <h2>{t("nextSteps")}</h2>
        <div className="intern-timeline">
          {[
            {
              number: "1",
              title: t("stepSubmittedTitle"),
              eta: t("stepSubmittedEta"),
              description: t("stepSubmittedDescription"),
              active: true,
            },
            {
              number: "2",
              title: t("stepManualTitle"),
              eta: t("stepManualEta"),
              description: t("stepManualDescription"),
              active: false,
            },
            {
              number: "3",
              title: t("stepMailTitle"),
              eta: t("stepMailEta"),
              description: t("stepMailDescription"),
              active: false,
            },
          ].map((step) => (
            <div
              className={`intern-timeline-step ${step.active ? "active" : ""}`}
              key={step.number}
            >
              <span>{step.number}</span>
              <div>
                <h3>
                  {step.title} <small>{step.eta}</small>
                </h3>
                <p>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="intern-result-footer">
        <Mail size={13} />
        {t("closeTab")}
      </p>
    </main>
  );
}
