import { Mail, RefreshCcw, Shield, X } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPercent } from "@/lib/utils";
import { CoinAvatar, CoinTopbar } from "@/components/layout/coin-shell";
import { InProgressOverlay } from "@/components/ui/in-progress-overlay";

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "—";

  return value.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function pseudoLogin(name: string) {
  return name.toLowerCase().replace(/\s+/g, ".").replace(/[^a-z0-9.]/g, "");
}

export default async function AdminInternsPage() {
  const [invitations, interns] = await Promise.all([
    prisma.invitation.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { acceptedByProfile: true },
    }),
    prisma.internProfile.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        attempts: {
          where: { status: { not: "IN_PROGRESS" } },
          orderBy: { submittedAt: "desc" },
          take: 1,
        },
      },
    }),
  ]);

  const pendingInvitations = invitations.filter((invitation) => invitation.status === "PENDING").length;
  const acceptedInvitations = invitations.filter((invitation) => invitation.status === "ACCEPTED").length;
  const completedAttempts = interns.filter((intern) => intern.attempts[0]).length;

  return (
    <main className="coin-page coin-page--overlay">
      <CoinTopbar
        title="Стажёры"
        subtitle="Управление кандидатами и их результатами"
        right={
          <button className="coin-btn coin-btn--primary" type="button">
            Создать стажёра
          </button>
        }
      />

      <div className="coin-page__body coin-page__body--overlay">
        <div className="coin-stats-grid coin-stats-grid--blurred">
          <article className="coin-card coin-stat-card">
            <div className="coin-stat-card__label">Всего стажёров</div>
            <div className="coin-stat-card__value-row">
              <strong className="coin-stat-card__value">{interns.length}</strong>
            </div>
          </article>
          <article className="coin-card coin-stat-card">
            <div className="coin-stat-card__label">Ожидают активации</div>
            <div className="coin-stat-card__value-row">
              <strong className="coin-stat-card__value">{pendingInvitations}</strong>
            </div>
          </article>
          <article className="coin-card coin-stat-card">
            <div className="coin-stat-card__label">Активировали доступ</div>
            <div className="coin-stat-card__value-row">
              <strong className="coin-stat-card__value">{acceptedInvitations}</strong>
            </div>
          </article>
          <article className="coin-card coin-stat-card">
            <div className="coin-stat-card__label">Есть результат</div>
            <div className="coin-stat-card__value-row">
              <strong className="coin-stat-card__value">{completedAttempts}</strong>
            </div>
          </article>
        </div>

        <div className="coin-table-card coin-table-card--blurred">
          <table className="tbl">
            <thead>
              <tr>
                <th>Кандидат</th>
                <th>Выдан доступ</th>
                <th>Последний результат</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {interns.slice(0, 8).map((intern) => {
                const latest = intern.attempts[0];
                return (
                  <tr key={intern.id}>
                    <td>
                      <div className="coin-candidate-cell">
                        <CoinAvatar name={intern.fullName} />
                        <div>
                          <div className="coin-candidate-cell__name">{intern.fullName}</div>
                          <div className="muted">@{pseudoLogin(intern.fullName) || "intern"}</div>
                        </div>
                      </div>
                    </td>
                    <td>{formatDateTime(intern.createdAt)}</td>
                    <td>{latest ? formatPercent(latest.scorePercent) : "—"}</td>
                    <td>
                      <span className={`chip ${latest ? "chip-green" : "chip-grey"}`}>
                        {latest ? "Есть попытка" : "Не проходил"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="coin-modal-backdrop" />
      <section className="coin-modal-card">
        <div className="coin-modal-card__header">
          <div>
            <div className="coin-modal-card__title">Новый стажёр</div>
            <div className="coin-modal-card__subtitle">
              Креденшелы будут сгенерированы автоматически
            </div>
          </div>
          <button className="coin-icon-button" type="button" aria-label="Закрыть">
            <X size={18} />
          </button>
        </div>

        <div className="coin-modal-card__body coin-modal-card__body--relative">
          <div className="coin-form-grid-2">
            <div>
              <label className="input-label" htmlFor="intern-first-name">
                Имя
              </label>
              <input className="coin-input coin-input--plain" defaultValue="Сергей" id="intern-first-name" />
            </div>
            <div>
              <label className="input-label" htmlFor="intern-last-name">
                Фамилия
              </label>
              <input className="coin-input coin-input--plain" defaultValue="Михайлов" id="intern-last-name" />
            </div>
          </div>

          <div>
            <label className="input-label" htmlFor="intern-email">
              Email
            </label>
            <div className="coin-field">
              <span className="coin-field__icon">
                <Mail size={16} />
              </span>
              <input
                className="coin-input"
                defaultValue="sergey.mikhailov@coin.team"
                id="intern-email"
              />
            </div>
          </div>

          <div>
            <label className="input-label">Технический трек</label>
            <div className="coin-track-grid">
              {[
                "Backend · API",
                "Backend · gRPC",
                "Mobile",
                "Web · Frontend",
              ].map((track, index) => (
                <div
                  className={`coin-track-option${index === 0 ? " coin-track-option--selected" : ""}`}
                  key={track}
                >
                  <span>{track}</span>
                  {index === 0 ? <span className="coin-track-option__check">✓</span> : null}
                </div>
              ))}
            </div>
          </div>

          <div className="coin-credentials-panel">
            <div className="coin-credentials-panel__header">
              <strong>Сгенерированные креденшелы</strong>
              <button className="coin-btn coin-btn--ghost coin-btn--xs" type="button">
                <RefreshCcw size={14} />
                Перегенерировать
              </button>
            </div>

            <div className="coin-credentials-grid">
              <div className="muted">Логин</div>
              <div className="coin-credentials-grid__value">sergey.mikhailov</div>
              <button className="coin-icon-button coin-icon-button--white" type="button">
                ⧉
              </button>
              <div className="muted">Пароль</div>
              <div className="coin-credentials-grid__value">K9x#mP2vL7nQ</div>
              <button className="coin-icon-button coin-icon-button--white" type="button">
                ⧉
              </button>
            </div>

            <div className="coin-help-text">
              <Shield size={14} />
              <span>
                Пароль будет захэширован перед сохранением. Скопируйте его сейчас, позже
                показать его снова нельзя.
              </span>
            </div>
          </div>

          <InProgressOverlay
            badgeLabel="TODO"
            title="Нет backend для login/password профиля"
            description="В текущей модели есть только token-only приглашение. Поля email, track, логин и пароль пока визуальные."
          />
        </div>

        <div className="coin-modal-card__footer">
          <button className="coin-btn coin-btn--ghost" type="button">
            Отмена
          </button>
          <button className="coin-btn coin-btn--primary" type="button">
            Создать и отправить
          </button>
        </div>
      </section>
    </main>
  );
}
