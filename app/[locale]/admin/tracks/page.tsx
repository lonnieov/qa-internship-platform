import Link from "next/link";
import {
  BarChart3,
  ChevronRight,
  Filter,
  Flag,
  Layers3,
  List,
  MoreHorizontal,
  Plus,
  Search,
  UsersRound,
} from "lucide-react";
import {
  createTrackAction,
  removeTrackMasterFromTrackAction,
} from "@/actions/admin";
import { getManageableTrackIds, requireAdminAccess } from "@/lib/auth";
import { ensureTracks } from "@/lib/tracks";
import { prisma } from "@/lib/prisma";
import { formatPercent } from "@/lib/utils";
import { TrackManageModal } from "@/components/admin/track-manage-modal";
import { WaveManageModal } from "@/components/admin/wave-manage-modal";
import { MasterAddModal } from "@/components/admin/master-add-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StopPropagationSpan } from "./stop-propagation-span";

type TrackStatusFilter = "all" | "active" | "hidden";

const trackColors = [
  "#0077FF",
  "#AA43C4",
  "#00CC52",
  "#FF8800",
  "#E0A500",
  "#FF4400",
  "#76787A",
];

function pluralRu(count: number, one: string, few: string, many: string) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function trackColor(index: number) {
  return trackColors[index % trackColors.length];
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join("");
}

function statTone(value: number | null | undefined) {
  if (typeof value !== "number") return "var(--muted-foreground)";
  if (value >= 80) return "var(--accent)";
  if (value >= 70) return "var(--foreground)";
  return "var(--warning)";
}

function filterHref(status: TrackStatusFilter, q: string) {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (q) params.set("q", q);
  return `/admin/tracks${params.size ? `?${params.toString()}` : ""}`;
}

export default async function AdminTracksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const profile = await requireAdminAccess();
  const manageableTrackIds = await getManageableTrackIds(profile);
  const { q, status } = await searchParams;
  const query = String(q ?? "").trim().toLowerCase();
  const statusFilter: TrackStatusFilter =
    status === "active" || status === "hidden" ? status : "all";

  await ensureTracks();

  const allTracks = await prisma.track.findMany({
    where: manageableTrackIds ? { id: { in: manageableTrackIds } } : undefined,
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: {
      waves: { orderBy: [{ order: "asc" }, { name: "asc" }] },
      members: {
        where: { role: "TRACK_MASTER" },
        include: { profile: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const tracks = allTracks.filter((track) => {
    const matchesQuery = query
      ? track.name.toLowerCase().includes(query) ||
        track.slug.toLowerCase().includes(query)
      : true;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? track.isActive : !track.isActive);
    return matchesQuery && matchesStatus;
  });

  const statsMap = new Map(
    await Promise.all(
      allTracks.map(async (track) => {
        const [
          questionCount,
          activeQuestionCount,
          internCount,
          invitationCount,
          attemptCount,
          completedAttempts,
          waveStats,
        ] = await Promise.all([
          prisma.question.count({ where: { trackId: track.id } }),
          prisma.question.count({ where: { trackId: track.id, isActive: true } }),
          prisma.internProfile.count({ where: { trackId: track.id } }),
          prisma.invitation.count({ where: { trackId: track.id } }),
          prisma.assessmentAttempt.count({ where: { trackId: track.id } }),
          prisma.assessmentAttempt.findMany({
            where: {
              trackId: track.id,
              status: { not: "IN_PROGRESS" },
              scorePercent: { not: null },
            },
            select: { scorePercent: true },
          }),
          Promise.all(
            track.waves.map(async (wave) => {
              const [waveInterns, waveAttempts, waveCompleted] =
                await Promise.all([
                  prisma.internProfile.count({ where: { waveId: wave.id } }),
                  prisma.assessmentAttempt.count({ where: { waveId: wave.id } }),
                  prisma.assessmentAttempt.findMany({
                    where: {
                      waveId: wave.id,
                      status: { not: "IN_PROGRESS" },
                      scorePercent: { not: null },
                    },
                    select: { scorePercent: true },
                  }),
                ]);
              const avgScore =
                waveCompleted.length === 0
                  ? null
                  : waveCompleted.reduce(
                      (sum, a) => sum + (a.scorePercent ?? 0),
                      0,
                    ) / waveCompleted.length;
              return [
                wave.id,
                { interns: waveInterns, attempts: waveAttempts, avgScore },
              ] as const;
            }),
          ),
        ]);

        const avgScore =
          completedAttempts.length === 0
            ? null
            : completedAttempts.reduce(
                (sum, a) => sum + (a.scorePercent ?? 0),
                0,
              ) / completedAttempts.length;

        return [
          track.id,
          {
            questionCount,
            activeQuestionCount,
            internCount,
            invitationCount,
            attemptCount,
            completedCount: completedAttempts.length,
            avgScore,
            waveStats: new Map(waveStats),
          },
        ] as const;
      }),
    ),
  );

  const totals = Array.from(statsMap.values()).reduce(
    (acc, item) => ({
      questions: acc.questions + item.questionCount,
      activeQuestions: acc.activeQuestions + item.activeQuestionCount,
      interns: acc.interns + item.internCount,
      waves: acc.waves,
      attempts: acc.attempts + item.attemptCount,
      completed: acc.completed + item.completedCount,
      weightedScore:
        acc.weightedScore + (item.avgScore ?? 0) * item.completedCount,
    }),
    {
      questions: 0,
      activeQuestions: 0,
      interns: 0,
      waves: allTracks.reduce((sum, t) => sum + t.waves.length, 0),
      attempts: 0,
      completed: 0,
      weightedScore: 0,
    },
  );
  const averageScore =
    totals.completed === 0 ? null : totals.weightedScore / totals.completed;

  return (
    <main className="page stack-lg">
      {/* ── Page header ── */}
      <div className="page-header">
        <div>
          <h1 className="head-1">Треки</h1>
          <p className="body-1 muted m-0">
            Управление направлениями, потоками, мастерами и статистикой
          </p>
        </div>
        <div className="nav-row">
          <form action="/admin/tracks" className="nav-row">
            <div style={{ position: "relative" }}>
              <Search
                size={15}
                style={{
                  left: 12,
                  position: "absolute",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--muted-foreground)",
                  pointerEvents: "none",
                }}
              />
              <Input
                name="q"
                placeholder="Введите название трека или slug"
                defaultValue={q ?? ""}
                style={{ paddingLeft: 36, width: 300 }}
              />
              {statusFilter !== "all" && (
                <input type="hidden" name="status" value={statusFilter} />
              )}
            </div>
          </form>
          {profile.role === "ADMIN" && (
            <form action={createTrackAction} className="nav-row">
              <Input
                name="name"
                placeholder="Новый трек"
                required
                style={{ width: 160 }}
              />
              <Button type="submit">
                <Plus size={16} />
                Создать трек
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* ── Summary cards ── */}
      <section className="grid-4">
        <Card>
          <CardContent className="metric-card">
            <div className="metric-card-row">
              <span className="body-2 muted">Всего треков</span>
              <Badge variant="muted">
                <Layers3 size={13} />
              </Badge>
            </div>
            <span
              className="metric-value"
              style={{ color: "var(--primary)" }}
            >
              {allTracks.length}
            </span>
            <span className="body-2 muted">из {allTracks.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="metric-card">
            <div className="metric-card-row">
              <span className="body-2 muted">Всего потоков</span>
              <Badge variant="muted">
                <List size={13} />
              </Badge>
            </div>
            <span
              className="metric-value"
              style={{ color: "var(--business)" }}
            >
              {totals.waves}
            </span>
            <span className="body-2 muted">активных</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="metric-card">
            <div className="metric-card-row">
              <span className="body-2 muted">Стажёров</span>
              <Badge variant="success">
                <UsersRound size={13} />
              </Badge>
            </div>
            <span
              className="metric-value"
              style={{ color: "var(--accent)" }}
            >
              {totals.interns}
            </span>
            <span className="body-2 muted">за всё время</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="metric-card">
            <div className="metric-card-row">
              <span className="body-2 muted">Средний результат</span>
              <Badge variant="warning">
                <BarChart3 size={13} />
              </Badge>
            </div>
            <span
              className="metric-value"
              style={{ color: statTone(averageScore) }}
            >
              {formatPercent(averageScore)}
            </span>
            <span className="body-2 muted">{totals.completed} завершённых</span>
          </CardContent>
        </Card>
      </section>

      {/* ── Filter row ── */}
      <div className="nav-row" style={{ justifyContent: "space-between" }}>
        <div className="nav-row">
          {(["all", "active", "hidden"] as const).map((item) => (
            <Button
              asChild
              key={item}
              size="sm"
              variant={statusFilter === item ? "default" : "secondary"}
            >
              <Link href={filterHref(item, query)}>
                {item === "all"
                  ? "Все"
                  : item === "active"
                    ? "Активные"
                    : "Скрытые"}
              </Link>
            </Button>
          ))}
        </div>
        <div className="nav-row body-2 muted">
          {tracks.length}{" "}
          {pluralRu(tracks.length, "трек", "трека", "треков")}
          <Button size="icon" variant="secondary" aria-label="Фильтры">
            <Filter size={16} />
          </Button>
        </div>
      </div>

      {/* ── Track list ── */}
      <section className="stack">
        {tracks.map((track, index) => {
          const item = statsMap.get(track.id);
          const color = trackColor(index);
          const questionCount = item?.questionCount ?? 0;
          const avgScore = item?.avgScore ?? null;

          return (
            <details
              className="track-card"
              key={track.id}
              style={{ opacity: track.isActive ? 1 : 0.75 }}
            >
              <summary>
                {/* Chevron */}
                <div className="track-chevron">
                  <ChevronRight size={16} />
                </div>

                {/* Track identity */}
                <div className="nav-row" style={{ minWidth: 0 }}>
                  <span
                    style={{
                      alignItems: "center",
                      background: `${color}1F`,
                      borderRadius: 12,
                      color,
                      display: "inline-flex",
                      flexShrink: 0,
                      fontWeight: 700,
                      fontSize: 16,
                      height: 40,
                      justifyContent: "center",
                      letterSpacing: "-0.02em",
                      width: 40,
                    }}
                  >
                    {initials(track.name) || track.name[0]}
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span className="nav-row" style={{ flexWrap: "nowrap", gap: 8 }}>
                      <strong style={{ fontSize: 15, letterSpacing: "-0.01em" }}>
                        {track.name}
                      </strong>
                      <span
                        className="body-2 muted"
                        style={{ fontFamily: "ui-monospace, monospace" }}
                      >
                        /{track.slug}
                      </span>
                      <Badge variant={track.isActive ? "success" : "muted"}>
                        {track.isActive ? "active" : "hidden"}
                      </Badge>
                    </span>
                    <span className="body-2 muted">
                      {track.waves.length}{" "}
                      {pluralRu(track.waves.length, "поток", "потока", "потоков")}{" "}
                      · {track.members.length}{" "}
                      {pluralRu(track.members.length, "мастер", "мастера", "мастеров")}{" "}
                      · {item?.internCount ?? 0} стажёров
                    </span>
                  </span>
                </div>

                {/* Stat cells */}
                <TrackStat
                  label="Вопросы"
                  value={`${item?.activeQuestionCount ?? 0}/${questionCount}`}
                />
                <TrackStat label="Инвайты" value={item?.invitationCount ?? 0} />
                <TrackStat label="Стажёры" value={item?.internCount ?? 0} />
                <TrackStat label="Попытки" value={item?.attemptCount ?? 0} />
                <TrackStat
                  label="Завершено"
                  value={item?.completedCount ?? 0}
                />
                <TrackStat
                  label="Средний"
                  value={formatPercent(avgScore)}
                  color={statTone(avgScore)}
                />

                {/* Action buttons */}
                <StopPropagationSpan className="nav-row" style={{ justifyContent: "flex-end" }}>
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/admin/questions?track=${track.slug}`}>
                      <List size={14} />
                      Вопросы
                    </Link>
                  </Button>
                  {profile.role === "ADMIN" ? (
                    <TrackManageModal
                      track={{ ...track, questionCount }}
                    />
                  ) : (
                    <Button
                      size="icon"
                      variant="secondary"
                      aria-label="Управление"
                      disabled
                    >
                      <MoreHorizontal size={15} />
                    </Button>
                  )}
                </StopPropagationSpan>
              </summary>

              {/* ── Expanded body ── */}
              <div className="track-card-body">
                {/* Waves */}
                <div className="track-waves-panel">
                  <div className="track-panel-header">
                    <div className="track-panel-title">
                      Потоки
                      <span className="track-count-badge">
                        {track.waves.length}
                      </span>
                    </div>
                    <WaveManageModal mode="create" trackId={track.id} />
                  </div>

                  {track.waves.length === 0 ? (
                    <div className="track-panel-empty">
                      <div className="track-panel-empty-icon">
                        <Flag size={16} />
                      </div>
                      <strong className="body-1">Потоки ещё не созданы</strong>
                      <span className="body-2 muted">
                        Создайте первый поток, чтобы запустить ассессменты
                      </span>
                    </div>
                  ) : (
                    <div className="stack-xs" style={{ gap: 8 }}>
                      {track.waves.map((wave) => {
                        const ws = item?.waveStats.get(wave.id);
                        const waveAvg = ws?.avgScore ?? null;
                        const canDelete =
                          (ws?.interns ?? 0) === 0 &&
                          (ws?.attempts ?? 0) === 0;
                        return (
                          <div className="wave-row" key={wave.id}>
                            {/* Name + slug */}
                            <div className="nav-row" style={{ minWidth: 0, gap: 10 }}>
                              <div className="wave-icon-box">
                                <Flag size={13} />
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {wave.name}
                                </div>
                                <div
                                  className="body-2 muted"
                                  style={{
                                    fontFamily: "ui-monospace, monospace",
                                    fontSize: 11,
                                  }}
                                >
                                  /{wave.slug}
                                </div>
                              </div>
                            </div>

                            {/* Status */}
                            <div>
                              <Badge
                                variant={wave.isActive ? "success" : "muted"}
                              >
                                {wave.isActive ? "active" : "hidden"}
                              </Badge>
                            </div>

                            {/* Interns */}
                            <div className="wave-stat-cell">
                              <strong>{ws?.interns ?? 0}</strong>
                              <span>стажёров</span>
                            </div>

                            {/* Attempts */}
                            <div className="wave-stat-cell">
                              <strong>{ws?.attempts ?? 0}</strong>
                              <span>попыток</span>
                            </div>

                            {/* Avg */}
                            <div className="wave-stat-cell">
                              <strong style={{ color: statTone(waveAvg) }}>
                                {formatPercent(waveAvg)}
                              </strong>
                              <span>средний</span>
                            </div>

                            {/* Edit */}
                            <div className="nav-row" style={{ justifyContent: "flex-end", gap: 4 }}>
                              <WaveManageModal
                                mode="edit"
                                wave={{
                                  id: wave.id,
                                  name: wave.name,
                                  order: wave.order,
                                  isActive: wave.isActive,
                                }}
                                canDelete={canDelete}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Masters */}
                <div className="track-masters-panel">
                  <div className="track-panel-header">
                    <div className="track-panel-title">
                      Мастера трека
                      <span className="track-count-badge">
                        {track.members.length}
                      </span>
                    </div>
                    {profile.role === "ADMIN" && (
                      <MasterAddModal
                        trackId={track.id}
                        trackName={track.name}
                      />
                    )}
                  </div>

                  {track.members.length === 0 ? (
                    <div className="track-panel-empty">
                      <div className="track-panel-empty-icon">
                        <UsersRound size={16} />
                      </div>
                      <strong className="body-1">Мастера не назначены</strong>
                      <span className="body-2 muted">
                        Назначьте ответственного за этот трек
                      </span>
                    </div>
                  ) : (
                    <div
                      className="nav-row"
                      style={{ flexWrap: "wrap", alignContent: "flex-start", gap: 8 }}
                    >
                      {track.members.map((member) => {
                        const name =
                          [member.profile.firstName, member.profile.lastName]
                            .filter(Boolean)
                            .join(" ") ||
                          member.profile.email ||
                          "Master";
                        const ini = initials(name) || name[0]?.toUpperCase();
                        return (
                          <div className="master-chip" key={member.id}>
                            <div
                              className="master-avatar"
                              style={{ background: color }}
                            >
                              {ini}
                            </div>
                            <div className="master-chip-info">
                              <div className="master-chip-name">{name}</div>
                              <div className="master-chip-email">
                                {member.profile.email}
                              </div>
                            </div>
                            {profile.role === "ADMIN" && (
                              <form action={removeTrackMasterFromTrackAction}>
                                <input
                                  type="hidden"
                                  name="trackId"
                                  value={track.id}
                                />
                                <input
                                  type="hidden"
                                  name="profileId"
                                  value={member.profileId}
                                />
                                <button
                                  type="submit"
                                  className="track-icon-btn"
                                  aria-label="Убрать мастера"
                                  style={{ width: 24, height: 24 }}
                                >
                                  ×
                                </button>
                              </form>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </details>
          );
        })}

        {tracks.length === 0 && (
          <Card>
            <CardContent className="p-6 muted">
              Треки не найдены.
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}

function TrackStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="track-stat">
      <span className="track-stat-label">{label}</span>
      <strong className="track-stat-value" style={{ color }}>
        {value}
      </strong>
    </div>
  );
}
