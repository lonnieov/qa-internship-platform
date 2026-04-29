import Link from "next/link";
import { Check, Clock3, Filter, Plus, Search, X } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPercent } from "@/lib/utils";
import { CoinAvatar, CoinSearchButton, CoinTopbar } from "@/components/layout/coin-shell";

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "--";

  return value.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusMeta(score: number | null, status: string) {
  if (status === "IN_PROGRESS") {
    return {
      label: "Проходит",
      className: "chip chip-blue",
      icon: <Clock3 size={12} />,
    };
  }

  if (status === "SUBMITTED" || status === "AUTO_SUBMITTED" || status === "EXPIRED") {
    if ((score ?? 0) >= 100) {
      return {
        label: "Принят",
        className: "chip chip-green",
        icon: <Check size={12} />,
      };
    }

    return {
      label: "Не прошёл",
      className: "chip chip-red",
      icon: <X size={12} />,
    };
  }

  return {
    label: "Ожидает",
    className: "chip chip-grey",
    icon: null,
  };
}

export default async function AdminPage() {
  const [internCount, attempts] = await Promise.all([
    prisma.internProfile.count(),
    prisma.assessmentAttempt.findMany({
      orderBy: { startedAt: "desc" },
      take: 6,
      include: {
        internProfile: {
          include: { profile: true },
        },
      },
    }),
  ]);

  const totalCandidates = internCount;
  const passed = attempts.filter((attempt) => (attempt.scorePercent ?? 0) >= 100).length;
  const inProgress = attempts.filter((attempt) => attempt.status === "IN_PROGRESS").length;
  const failed = attempts.filter(
    (attempt) => attempt.status !== "IN_PROGRESS" && (attempt.scorePercent ?? 0) < 100,
  ).length;

  return (
    <main className="coin-page">
      <CoinTopbar
        title="Стажёры"
        subtitle="Управление кандидатами и их результатами"
        right={
          <>
            <CoinSearchButton />
            <Link className="coin-btn coin-btn--primary" href="/admin/interns">
              <Plus size={16} />
              Создать стажёра
            </Link>
          </>
        }
      />

      <div className="coin-page__body">
        <div className="coin-stats-grid">
          <div className="coin-card coin-stat-card">
            <div className="coin-stat-card__label">Всего кандидатов</div>
            <div className="coin-stat-card__value-row">
              <div className="coin-stat-card__value">{totalCandidates}</div>
              <div className="t-body2 muted">всего</div>
            </div>
          </div>
          <div className="coin-card coin-stat-card">
            <div className="coin-stat-card__label">Прошли успешно</div>
            <div className="coin-stat-card__value-row">
              <div className="coin-stat-card__value" style={{ color: "var(--c-green)" }}>
                {passed}
              </div>
              <div className="t-body2 muted">100%</div>
            </div>
          </div>
          <div className="coin-card coin-stat-card">
            <div className="coin-stat-card__label">В процессе</div>
            <div className="coin-stat-card__value-row">
              <div className="coin-stat-card__value" style={{ color: "var(--c-blue)" }}>
                {inProgress}
              </div>
            </div>
          </div>
          <div className="coin-card coin-stat-card">
            <div className="coin-stat-card__label">Не прошли</div>
            <div className="coin-stat-card__value-row">
              <div className="coin-stat-card__value" style={{ color: "var(--c-red)" }}>
                {failed}
              </div>
            </div>
          </div>
        </div>

        <div className="coin-filters-row">
          <div className="coin-search-input">
            <Search size={16} />
            <input className="coin-input" placeholder="Поиск по имени или логину" />
          </div>
          <button className="coin-btn coin-btn--secondary" type="button">
            <Filter size={16} />
            Все треки
          </button>
          <button className="coin-btn coin-btn--secondary" type="button">
            <Filter size={16} />
            Все статусы
          </button>
          <div className="coin-filters-row__spacer" />
          <span className="t-body2 muted">{attempts.length} из {totalCandidates}</span>
        </div>

        <div className="coin-table-card">
          <table className="tbl">
            <thead>
              <tr>
                <th>Кандидат</th>
                <th>Трек</th>
                <th>Статус</th>
                <th style={{ textAlign: "right" }}>Балл</th>
                <th>Время</th>
                <th>Дата</th>
                <th style={{ width: 60 }} />
              </tr>
            </thead>
            <tbody>
              {attempts.map((attempt) => {
                const meta = statusMeta(attempt.scorePercent, attempt.status);
                return (
                  <tr key={attempt.id}>
                    <td>
                      <div className="coin-candidate-cell">
                        <CoinAvatar name={attempt.internProfile.fullName} />
                        <div>
                          <div className="coin-candidate-cell__name">
                            {attempt.internProfile.fullName}
                          </div>
                          <div className="t-body2 muted">
                            @
                            {attempt.internProfile.fullName
                              .toLowerCase()
                              .replace(/\s+/g, ".")}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="muted">General · QA</td>
                    <td>
                      <span className={meta.className}>
                        {meta.icon}
                        {meta.label}
                      </span>
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                        fontWeight: 500,
                        color:
                          attempt.scorePercent == null
                            ? "var(--c-g80)"
                            : attempt.scorePercent === 100
                              ? "var(--c-green)"
                              : attempt.scorePercent >= 85
                                ? "var(--c-orange)"
                                : "var(--c-red)",
                      }}
                    >
                      {attempt.scorePercent == null ? "—" : formatPercent(attempt.scorePercent)}
                    </td>
                    <td className="muted" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {attempt.totalTimeSeconds
                        ? `${Math.floor(attempt.totalTimeSeconds / 60)}:${String(
                            attempt.totalTimeSeconds % 60,
                          ).padStart(2, "0")}`
                        : "—"}
                    </td>
                    <td className="muted">{formatDateTime(attempt.submittedAt ?? attempt.startedAt)}</td>
                    <td>
                      <Link className="coin-icon-button" href={`/admin/attempts/${attempt.id}`}>
                        <Search size={16} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {attempts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="muted">
                    Пока нет попыток.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
