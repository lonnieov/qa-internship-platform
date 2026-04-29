import { Check, Clock3 } from "lucide-react";
import { updateSettingsAction } from "@/actions/admin";
import { getSettings } from "@/lib/assessment";
import { CoinTopbar } from "@/components/layout/coin-shell";
import { InProgressOverlay } from "@/components/ui/in-progress-overlay";

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <main className="coin-page">
      <CoinTopbar
        title="Настройки теста"
        subtitle="Параметры применяются ко всем новым ассессментам"
        right={
          <>
            <button className="coin-btn coin-btn--ghost" type="button">
              Отменить
            </button>
            <button className="coin-btn coin-btn--primary" form="coin-settings-form" type="submit">
              <Check size={16} />
              Сохранить
            </button>
          </>
        }
      />

      <div className="coin-page__body">
        <form action={updateSettingsAction} className="coin-settings-stack" id="coin-settings-form">
          <section className="coin-settings-card">
            <div className="coin-settings-card__head">
              <div className="coin-settings-card__icon">
                <Clock3 size={22} />
              </div>
              <div>
                <h2 className="coin-settings-card__title">Общее время на ассессмент</h2>
                <p className="coin-settings-card__subtitle">
                  После окончания теста все непосещённые вопросы автоматически получают 0 баллов.
                </p>
              </div>
            </div>

            <div className="coin-time-row">
              <div className="coin-time-input">
                <input
                  defaultValue={settings.totalTimeMinutes}
                  id="totalTimeMinutes"
                  max="240"
                  min="1"
                  name="totalTimeMinutes"
                  type="number"
                />
                <span>минут</span>
              </div>

              <div className="coin-time-presets">
                {[15, 30, 45, 60].map((value) => (
                  <button
                    className={`coin-btn coin-btn--secondary${value === settings.totalTimeMinutes ? " coin-btn--secondary-active" : ""}`}
                    key={value}
                    type="button"
                  >
                    {value} мин
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="coin-slider-track">
                <div className="coin-slider-track__fill" />
                <div className="coin-slider-track__thumb" />
              </div>
              <div className="coin-slider-track__labels">
                <span>5 мин</span>
                <span>90 мин</span>
              </div>
            </div>
          </section>

          <section className="coin-settings-card coin-panel--relative">
            <h2 className="coin-settings-card__title">Состав ассессмента</h2>
            <p className="coin-settings-card__subtitle">
              Количество вопросов, выбираемых случайно из банка для каждого трека.
            </p>

            <div className="coin-pool-grid">
              {[
                { label: "API", count: 5, pool: 10, color: "var(--primary)" },
                { label: "gRPC", count: 3, pool: 6, color: "var(--business)" },
                { label: "Mobile", count: 4, pool: 8, color: "var(--accent)" },
                { label: "Web", count: 4, pool: 8, color: "var(--gold)" },
              ].map((item) => (
                <div className="coin-pool-card" key={item.label}>
                  <div className="coin-pool-card__label">
                    <span style={{ background: item.color }} />
                    {item.label}
                  </div>
                  <div className="coin-pool-card__value">
                    <input defaultValue={item.count} type="text" />
                    <span>из {item.pool}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="coin-total-banner">Итого 16 вопросов · ~1.9 мин на вопрос</div>

            <InProgressOverlay
              badgeLabel="TODO"
              compact
              title="Нет track composition в схеме"
              description="Сейчас runtime поддерживает только общий таймер и фиксированный passing score."
            />
          </section>

          <section className="coin-settings-card coin-panel--relative">
            <h2 className="coin-settings-card__title">Поведение и трекинг</h2>

            <div className="coin-switch-list">
              {[
                "Трекинг курсора и кликов",
                "Время на каждом вопросе",
                "Проходной балл — 100%",
                "Возможность вернуться к пропущенным",
                "Защита от копирования контента",
              ].map((item, index) => (
                <div className="coin-switch-row" key={item}>
                  <div>
                    <div className="coin-switch-row__title">{item}</div>
                    <div className="coin-switch-row__subtitle">
                      {index < 4
                        ? "Поведение предусмотрено текущим продуктом или зафиксировано в коде."
                        : "Макетный toggle без backend-поддержки."}
                    </div>
                  </div>
                  <div className={`coin-switch${index < 4 ? " coin-switch--on" : ""}`}>
                    <span />
                  </div>
                </div>
              ))}
            </div>

            <InProgressOverlay
              badgeLabel="TODO"
              compact
              title="Часть переключателей ещё не управляется настройками"
              description="В продукте не хватает отдельных storage-полей для advanced behavior toggles."
            />
          </section>
        </form>
      </div>
    </main>
  );
}
