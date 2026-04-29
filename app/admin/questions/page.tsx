import { Copy, Filter, List, Plus, Trash2 } from "lucide-react";
import { stringifyPrettyJson } from "@/lib/api-sandbox";
import { prisma } from "@/lib/prisma";
import { CoinTopbar } from "@/components/layout/coin-shell";
import { InProgressOverlay } from "@/components/ui/in-progress-overlay";

function trackMeta(type: "QUIZ" | "API_SANDBOX" | "DEVTOOLS_SANDBOX") {
  if (type === "API_SANDBOX") {
    return { label: "API", className: "chip chip-blue" };
  }

  if (type === "DEVTOOLS_SANDBOX") {
    return { label: "Web", className: "chip chip-orange" };
  }

  return { label: "General", className: "chip chip-grey" };
}

export default async function AdminQuestionsPage() {
  const questions = await prisma.question.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: { options: { orderBy: { order: "asc" } } },
  });

  return (
    <main className="coin-page">
      <CoinTopbar
        title="Вопросы"
        subtitle={`Банк вопросов · ${questions.length} записей`}
        right={
          <>
            <button className="coin-btn coin-btn--secondary" type="button">
              <Copy size={16} />
              Импорт
            </button>
            <button className="coin-btn coin-btn--primary" type="button">
              <Plus size={16} />
              Новый вопрос
            </button>
          </>
        }
      />

      <div className="coin-questions-layout">
        <aside className="coin-questions-rail coin-panel coin-panel--relative">
          <div className="coin-rail-section-title">Треки</div>
          <div className="coin-rail-list">
            {[
              { label: "Все треки", count: questions.length, active: true },
              { label: "API", count: questions.filter((question) => question.type === "API_SANDBOX").length },
              { label: "gRPC", count: 0 },
              { label: "Mobile", count: 0 },
              { label: "Web", count: questions.filter((question) => question.type === "DEVTOOLS_SANDBOX").length },
            ].map((item) => (
              <button
                className={`coin-rail-item${item.active ? " coin-rail-item--active" : ""}`}
                key={item.label}
                type="button"
              >
                <span className="coin-rail-item__label">
                  {item.label === "Все треки" ? <List size={16} /> : <span className="coin-rail-item__dot" />}
                  {item.label}
                </span>
                <span>{item.count}</span>
              </button>
            ))}
          </div>

          <div className="coin-divider" />

          <div className="coin-rail-section-title">Действия</div>
          <div className="coin-rail-list">
            <button className="coin-rail-item" type="button">
              <span className="coin-rail-item__label">
                <Filter size={16} />
                Фильтры
              </span>
            </button>
            <button className="coin-rail-item" type="button">
              <span className="coin-rail-item__label">
                <Copy size={16} />
                Экспорт CSV
              </span>
            </button>
          </div>

          <InProgressOverlay
            badgeLabel="TODO"
            compact
            title="Нет треков и CRUD-флоу из макета"
            description="Сейчас backend знает только тип вопроса и порядок. Track-specific фильтры и экран редактирования ещё не реализованы."
          />
        </aside>

        <section className="coin-questions-list">
          {questions.map((question, index) => {
            const meta = trackMeta(question.type);

            return (
              <article className="coin-question-card" key={question.id}>
                <div className="coin-question-card__index">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div className="coin-question-card__content">
                  <div className="coin-question-card__meta">
                    <span className={meta.className}>{meta.label}</span>
                    <span className="muted">используется в активных ассессментах</span>
                  </div>
                  <h2 className="coin-question-card__title">{question.text}</h2>

                  {question.type === "QUIZ" ? (
                    <div className="coin-option-grid">
                      {question.options.map((option) => (
                        <div
                          className={`coin-option-card${option.isCorrect ? " coin-option-card--correct" : ""}`}
                          key={option.id}
                        >
                          <span className="coin-option-card__radio">
                            {option.isCorrect ? "✓" : ""}
                          </span>
                          <span>{option.text}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="coin-json-card">
                      <pre>{stringifyPrettyJson(question.apiConfig)}</pre>
                    </div>
                  )}
                </div>

                <div className="coin-question-card__actions">
                  <button className="coin-icon-button" type="button" aria-label="Копировать">
                    <Copy size={16} />
                  </button>
                  <button className="coin-icon-button" type="button" aria-label="Удалить">
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            );
          })}

          {questions.length === 0 ? (
            <div className="coin-empty-state">Пока нет вопросов.</div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
