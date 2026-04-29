import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { getResultAttemptId, verifyResultTicket } from "@/lib/intern-token-auth";
import { prisma } from "@/lib/prisma";
import { formatPercent } from "@/lib/utils";
import { logoutInternAction } from "@/actions/intern";
import { CoinAvatar, CoinLogo } from "@/components/layout/coin-shell";

function formatSpent(attempt: {
  startedAt: Date;
  submittedAt: Date | null;
  totalTimeSeconds: number | null;
}) {
  const totalSeconds =
    attempt.totalTimeSeconds ??
    Math.max(
      0,
      Math.round(
        ((attempt.submittedAt?.getTime() ?? attempt.startedAt.getTime()) -
          attempt.startedAt.getTime()) /
          1000,
      ),
    );
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

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
  const passed = score >= 100;
  const spent = formatSpent(attempt);
  const averageSeconds =
    attempt.questionCount > 0
      ? Math.round((attempt.totalTimeSeconds ?? 0) / attempt.questionCount)
      : 0;

  return (
    <main className="coin-intern-page">
      <header className="coin-intern-topbar">
        <CoinLogo compact />
        <div className="coin-intern-topbar__profile">
          <CoinAvatar name={attempt.internProfile.fullName} />
          <div className="coin-intern-topbar__name">{attempt.internProfile.fullName}</div>
          <form action={logoutInternAction}>
            <button className="coin-icon-button" type="submit" aria-label="Выйти">
              <LogOut size={18} />
            </button>
          </form>
        </div>
      </header>

      <section className="coin-intern-center">
        <div className="coin-result-card">
          <div className="coin-result-ring">
            <svg viewBox="0 0 200 200">
              <circle cx="100" cy="100" fill="none" r="86" stroke="#ebf0f5" strokeWidth="16" />
              <circle
                cx="100"
                cy="100"
                fill="none"
                r="86"
                stroke={passed ? "#00cc52" : "#ff4400"}
                strokeDasharray={`${2 * Math.PI * 86 * (score / 100)} ${2 * Math.PI * 86}`}
                strokeLinecap="round"
                strokeWidth="16"
                transform="rotate(-90 100 100)"
              />
            </svg>
            <div className="coin-result-ring__content">
              <div className={`coin-result-ring__value${passed ? " is-passed" : " is-failed"}`}>
                {formatPercent(score)}
              </div>
              <div className="muted">
                {attempt.correctCount} из {attempt.questionCount}
              </div>
            </div>
          </div>

          <div className="coin-result-card__copy">
            <h1>{passed ? "Поздравляем, вы прошли!" : "Ассессмент не пройден"}</h1>
            <p>
              {passed
                ? "Вы ответили правильно на все вопросы ассессмента. HR-команда свяжется с вами в течение 2-3 рабочих дней."
                : "В текущей модели нужен результат 100%. Для нового прохождения потребуется новый доступ от администратора."}
            </p>
          </div>

          <div className="coin-result-breakdown">
            {[
              { label: "API", value: "TODO", color: "var(--primary)" },
              { label: "gRPC", value: "TODO", color: "var(--business)" },
              { label: "Mobile", value: "TODO", color: "var(--accent)" },
              { label: "Web", value: "TODO", color: "var(--gold)" },
            ].map((item) => (
              <div className="coin-result-breakdown__item" key={item.label}>
                <div className="coin-result-breakdown__label" style={{ color: item.color }}>
                  {item.label}
                </div>
                <div className="coin-result-breakdown__value">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="coin-result-summary">
            <div>
              <div className="muted">Затрачено времени</div>
              <div className="coin-result-summary__value">
                {spent} <span>из TODO</span>
              </div>
            </div>
            <div className="coin-result-summary__right">
              <div className="muted">Среднее на вопрос</div>
              <div className="coin-result-summary__value">
                {Math.floor(averageSeconds / 60)}:{String(averageSeconds % 60).padStart(2, "0")}
              </div>
            </div>
          </div>

          <form action={logoutInternAction}>
            <button className="coin-btn coin-btn--secondary coin-btn--lg coin-btn--full" type="submit">
              <LogOut size={18} />
              Выйти из системы
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
