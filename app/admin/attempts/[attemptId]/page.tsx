import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Clock3, Flag, MousePointer2, RefreshCcw, X } from "lucide-react";
import { stringifyPrettyJson } from "@/lib/api-sandbox";
import { prisma } from "@/lib/prisma";
import { formatDuration, formatPercent } from "@/lib/utils";
import { CoinTopbar } from "@/components/layout/coin-shell";
import { ReportPrintButton } from "@/components/admin/report-print-button";
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

export default async function AttemptDetailsPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const attempt = await prisma.assessmentAttempt.findUnique({
    where: { id: attemptId },
    include: {
      internProfile: true,
      answers: {
        include: {
          question: { include: { options: { orderBy: { order: "asc" } } } },
          selectedOption: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!attempt) notFound();

  const score = attempt.scorePercent ?? 0;
  const totalTimeMs =
    typeof attempt.totalTimeSeconds === "number"
      ? attempt.totalTimeSeconds * 1000
      : Math.max(
          0,
          (attempt.submittedAt?.getTime() ?? Date.now()) - attempt.startedAt.getTime(),
        );
  const averageQuestionTimeMs =
    attempt.questionCount > 0
      ? Math.round(
          attempt.answers.reduce((sum, answer) => sum + answer.timeSpentMs, 0) /
            attempt.questionCount,
        )
      : 0;
  const focusAnswer =
    attempt.answers.find((answer) => !answer.isCorrect) ?? attempt.answers[0] ?? null;

  return (
    <main className="coin-page">
      <CoinTopbar
        title={
          <span className="coin-inline-title">
            <Link className="coin-inline-back" href="/admin">
              <ArrowLeft size={18} />
            </Link>
            {attempt.internProfile.fullName}
          </span>
        }
        subtitle={`@${attempt.internProfile.fullName.toLowerCase().replace(/\s+/g, ".")} · ${attempt.startedAt.toLocaleDateString("ru-RU")}`}
        right={
          <>
            <ReportPrintButton />
            <button className="coin-btn coin-btn--secondary" type="button">
              Сбросить попытку
            </button>
          </>
        }
      />

      <div className="coin-results-layout report-print-area">
        <aside className="coin-results-sidebar">
          <div className="coin-score-ring">
            <svg viewBox="0 0 160 160">
              <circle cx="80" cy="80" fill="none" r="68" stroke="#ebf0f5" strokeWidth="14" />
              <circle
                cx="80"
                cy="80"
                fill="none"
                r="68"
                stroke={score >= 100 ? "#00cc52" : "#ff8800"}
                strokeDasharray={`${2 * Math.PI * 68 * (score / 100)} ${2 * Math.PI * 68}`}
                strokeLinecap="round"
                strokeWidth="14"
                transform="rotate(-90 80 80)"
              />
            </svg>
            <div className="coin-score-ring__content">
              <div className="coin-score-ring__value">{formatPercent(score)}</div>
              <div className="muted">
                {attempt.correctCount} из {attempt.questionCount} верно
              </div>
            </div>
          </div>

          <div className="coin-results-sidebar__status">
            <span className={`chip ${score >= 100 ? "chip-green" : "chip-red"}`}>
              {score >= 100 ? "Прошёл" : "Не прошёл"}
            </span>
          </div>

          <div className="coin-results-metrics">
            {[
              { icon: <Clock3 size={16} />, label: "Общее время", value: formatDuration(totalTimeMs) },
              {
                icon: <Clock3 size={16} />,
                label: "Среднее на вопрос",
                value: formatDuration(averageQuestionTimeMs),
              },
              { icon: <MousePointer2 size={16} />, label: "Кликов мышью", value: "TODO" },
              { icon: <RefreshCcw size={16} />, label: "Возвратов к вопросам", value: "TODO" },
              {
                icon: <Flag size={16} />,
                label: "Дольше всего на вопросе",
                value: focusAnswer
                  ? `#${attempt.answers.indexOf(focusAnswer) + 1} — ${formatDuration(focusAnswer.timeSpentMs)}`
                  : "—",
              },
            ].map((item) => (
              <div className="coin-results-metric" key={item.label}>
                <div className="coin-results-metric__label">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>

          <div className="coin-answers-title">Ответы по вопросам</div>
          <div className="coin-answer-index-grid">
            {attempt.answers.map((answer, index) => (
              <div
                className={`coin-answer-index${focusAnswer?.id === answer.id ? " coin-answer-index--active" : ""}${answer.isCorrect ? " coin-answer-index--correct" : " coin-answer-index--wrong"}`}
                key={answer.id}
              >
                {index + 1}
              </div>
            ))}
          </div>
        </aside>

        <section className="coin-results-viewer">
          <div className="coin-results-viewer__head">
            <div>
              <div className="coin-results-viewer__title">
                Вопрос #{focusAnswer ? attempt.answers.indexOf(focusAnswer) + 1 : 1}
              </div>
              <div className="coin-results-viewer__subtitle">
                {focusAnswer
                  ? `${trackMeta(focusAnswer.question.type).label} · ${formatDuration(focusAnswer.timeSpentMs)} на странице`
                  : "Нет данных"}
              </div>
            </div>
          </div>

          <div className="coin-results-canvas coin-panel coin-panel--relative">
            {focusAnswer ? (
              <div className="coin-results-canvas__content">
                <div className="coin-question-card__meta">
                  <span className={trackMeta(focusAnswer.question.type).className}>
                    {trackMeta(focusAnswer.question.type).label}
                  </span>
                  <span className="muted">
                    Вопрос {attempt.answers.indexOf(focusAnswer) + 1} из {attempt.answers.length}
                  </span>
                </div>

                <h2 className="coin-results-canvas__question">{focusAnswer.question.text}</h2>

                {focusAnswer.question.type === "QUIZ" ? (
                  <div className="coin-option-grid">
                    {focusAnswer.question.options.map((option) => (
                      <div
                        className={`coin-option-card${
                          option.id === focusAnswer.selectedOptionId
                            ? focusAnswer.isCorrect
                              ? " coin-option-card--correct"
                              : " coin-option-card--wrong"
                            : ""
                        }`}
                        key={option.id}
                      >
                        <span className="coin-option-card__radio">
                          {option.id === focusAnswer.selectedOptionId
                            ? focusAnswer.isCorrect
                              ? "✓"
                              : "•"
                            : ""}
                        </span>
                        <span>{option.text}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="coin-json-stack">
                    <div className="coin-json-card">
                      <div className="coin-json-card__label">Request</div>
                      <pre>{focusAnswer.apiRequest ? stringifyPrettyJson(focusAnswer.apiRequest) : "—"}</pre>
                    </div>
                    <div className="coin-json-card">
                      <div className="coin-json-card__label">Response</div>
                      <pre>{focusAnswer.apiResponse ? stringifyPrettyJson(focusAnswer.apiResponse) : "—"}</pre>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            <InProgressOverlay
              badgeLabel="TODO"
              title="Heatmap и review-аннотации не подключены"
              description="В текущем backend нет полноценного слоя для визуализации курсора, кликов и ручной оценки поверх макетного viewer."
            />
          </div>

          <div className="coin-results-review-list">
            {attempt.answers.map((answer, index) => (
              <div className="coin-results-review-item" key={answer.id}>
                <div className="coin-results-review-item__head">
                  <div className="coin-results-review-item__title">
                    <span className="coin-results-review-item__number">{index + 1}</span>
                    <span>{answer.question.text}</span>
                  </div>
                  <span className={`chip ${answer.isCorrect ? "chip-green" : "chip-red"}`}>
                    {answer.isCorrect ? (
                      <>
                        <Check size={12} />
                        верно
                      </>
                    ) : (
                      <>
                        <X size={12} />
                        ошибка
                      </>
                    )}
                  </span>
                </div>
                <div className="coin-results-review-item__meta">
                  <span>{formatDuration(answer.timeSpentMs)}</span>
                  <span>отправок: {answer.submissionCount}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
