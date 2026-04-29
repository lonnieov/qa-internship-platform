import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock3, List, LogOut, Play } from "lucide-react";
import { logoutInternAction, startAttemptAction } from "@/actions/intern";
import { getSettings } from "@/lib/assessment";
import { requireIntern } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CoinAvatar, CoinLogo } from "@/components/layout/coin-shell";

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
    <main className="coin-intern-page">
      <header className="coin-intern-topbar">
        <CoinLogo compact />
        <div className="coin-intern-topbar__profile">
          <CoinAvatar name={profile.internProfile.fullName} />
          <div>
            <div className="coin-intern-topbar__name">{profile.internProfile.fullName}</div>
            <div className="coin-intern-topbar__role">TODO · трек кандидата</div>
          </div>
          <form action={logoutInternAction}>
            <button className="coin-icon-button" type="submit" aria-label="Выйти">
              <LogOut size={18} />
            </button>
          </form>
        </div>
      </header>

      <section className="coin-intern-center">
        <div className="coin-start-card">
          <div className="coin-start-card__icon">
            <Play size={32} />
          </div>

          <div className="coin-start-card__copy">
            <h1>Готовы начать ассессмент?</h1>
            <p>
              Привет, {profile.internProfile.fullName}! Пройдите технический отбор по
              треку <strong>TODO</strong>
            </p>
          </div>

          <div className="coin-start-stats">
            {[
              { icon: <List size={18} />, label: "Вопросов", value: String(activeQuestionCount) },
              {
                icon: <Clock3 size={18} />,
                label: "Времени",
                value: `${settings.totalTimeMinutes} мин`,
              },
              { icon: <CheckCircle2 size={18} />, label: "Проходной балл", value: "100%" },
            ].map((item) => (
              <div className="coin-start-stat" key={item.label}>
                <div className="coin-start-stat__icon">{item.icon}</div>
                <div className="coin-start-stat__value">{item.value}</div>
                <div className="coin-start-stat__label">{item.label}</div>
              </div>
            ))}
          </div>

          <div className="coin-start-rules">
            <div className="coin-start-rules__title">Перед началом обратите внимание</div>
            {[
              "Каждый вопрос имеет 4 варианта ответа, верный — только один.",
              "Вы можете возвращаться к пропущенным вопросам в пределах общего времени.",
              "Когда время закончится, тест завершится автоматически. Незаполненные ответы получат 0 баллов.",
              "С момента нажатия «Старт» система записывает движения курсора и время на каждом вопросе.",
            ].map((rule) => (
              <div className="coin-start-rule" key={rule}>
                <CheckCircle2 size={16} />
                <span>{rule}</span>
              </div>
            ))}
          </div>

          {inProgress ? (
            <Link className="coin-btn coin-btn--primary coin-btn--lg coin-btn--full" href={`/intern/test?attempt=${inProgress.id}`}>
              <Play size={18} />
              Продолжить ассессмент
            </Link>
          ) : (
            <form action={startAttemptAction}>
              <button
                className="coin-btn coin-btn--primary coin-btn--lg coin-btn--full"
                disabled={activeQuestionCount === 0}
                type="submit"
              >
                <Play size={18} />
                Старт ассессмента
              </button>
            </form>
          )}

          <div className="coin-start-card__footnote">
            Нажимая «Старт», вы соглашаетесь с записью телеметрии: курсор, клики и время.
          </div>

          {attempts.length > 0 ? (
            <div className="coin-start-history">
              <div className="coin-start-history__title">Последние попытки</div>
              <div className="coin-start-history__list">
                {attempts.map((attempt) => (
                  <div className="coin-start-history__item" key={attempt.id}>
                    <span>{attempt.startedAt.toLocaleString("ru-RU")}</span>
                    <strong>{attempt.status}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
