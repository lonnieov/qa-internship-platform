"use client";

import { useState } from "react";

// ─── Layout constants ────────────────────────────────────────────────────────
const COL_X = [82, 248, 418, 590, 762, 932];
const NODE_W = 152;
const NODE_H = 44;
const ROW_H = 72;
const ROW_BASE = 54;
const SVG_W = 1020;
const SVG_H = 840;

function cy(row: number) {
  return ROW_BASE + row * ROW_H;
}

// ─── Colours ─────────────────────────────────────────────────────────────────
const CAT_COLOR: Record<string, string> = {
  actor: "#e07575",
  client: "#6b9de8",
  auth: "#a06ee8",
  action: "#6ec86e",
  data: "#e8a060",
  external: "#60c8c8",
};

const LEGEND = [
  { cat: "actor", label: "Актор" },
  { cat: "client", label: "Страница" },
  { cat: "auth", label: "Auth / Middleware" },
  { cat: "action", label: "Server Action" },
  { cat: "data", label: "База данных" },
  { cat: "external", label: "Внешний сервис" },
];

const COLUMNS = [
  "АКТОРЫ",
  "СТРАНИЦЫ",
  "AUTH",
  "SERVER ACTIONS",
  "БАЗА ДАННЫХ",
  "ВНЕШНИЕ",
];

// ─── Nodes ───────────────────────────────────────────────────────────────────
type Node = {
  id: string;
  label: string;
  sub?: string;
  col: number;
  row: number;
  cat: keyof typeof CAT_COLOR;
};

const NODES: Node[] = [
  // ACTORS
  { id: "a_admin", label: "Администратор", sub: "браузер", col: 0, row: 1, cat: "actor" },
  { id: "a_tm", label: "Трек-мастер", sub: "браузер", col: 0, row: 4.3, cat: "actor" },
  { id: "a_intern", label: "Стажёр", sub: "браузер", col: 0, row: 8.2, cat: "actor" },

  // PAGES
  { id: "p_signin_admin", label: "/sign-in/admin", col: 1, row: 0.1, cat: "client" },
  { id: "p_admin", label: "/admin", sub: "дашборд", col: 1, row: 1.5, cat: "client" },
  { id: "p_interns", label: "/admin/interns", col: 1, row: 3.1, cat: "client" },
  { id: "p_settings", label: "/admin/settings", col: 1, row: 4.8, cat: "client" },
  { id: "p_signin_intern", label: "/sign-in/intern", col: 1, row: 7.2, cat: "client" },
  { id: "p_test", label: "/intern/test", col: 1, row: 8.7, cat: "client" },
  { id: "p_result", label: "/intern/result", col: 1, row: 10.3, cat: "client" },

  // AUTH
  { id: "auth_sess", label: "Admin Session", sub: "12h TTL · httpOnly", col: 2, row: 0.5, cat: "auth" },
  { id: "auth_req_adm", label: "requireAdmin()", sub: "только ADMIN", col: 2, row: 3.1, cat: "auth" },
  { id: "auth_req_acc", label: "requireAdminAccess()", sub: "ADMIN | TRACK_MASTER", col: 2, row: 4.8, cat: "auth" },
  { id: "auth_itok", label: "Intern Token", sub: "14d TTL · JWT-like", col: 2, row: 7.5, cat: "auth" },
  { id: "auth_req_int", label: "requireIntern()", col: 2, row: 9.2, cat: "auth" },

  // ACTIONS
  { id: "act_login_a", label: "loginAdminAction", sub: "PBKDF2-SHA256", col: 3, row: 0.1, cat: "action" },
  { id: "act_create_inv", label: "createInvitation", sub: "Action", col: 3, row: 3.1, cat: "action" },
  { id: "act_upd_set", label: "updateSettings", sub: "Action", col: 3, row: 4.8, cat: "action" },
  { id: "act_login_i", label: "loginInternBy", sub: "TokenAction", col: 3, row: 7.2, cat: "action" },
  { id: "act_start", label: "startAttempt", sub: "Action", col: 3, row: 8.7, cat: "action" },
  { id: "act_answer", label: "submitAnswer", sub: "Action", col: 3, row: 9.7, cat: "action" },
  { id: "act_submit", label: "submitAttempt", sub: "Action", col: 3, row: 10.7, cat: "action" },

  // DATABASE
  { id: "db_profile", label: "Profile", sub: "email · role · hash", col: 4, row: 0.5, cat: "data" },
  { id: "db_asess", label: "AdminSession", sub: "hmacHash · expiresAt", col: 4, row: 1.5, cat: "data" },
  { id: "db_inv", label: "Invitation", sub: "codeHash · status", col: 4, row: 3.1, cat: "data" },
  { id: "db_settings", label: "AssessmentSettings", sub: "totalTimeMinutes", col: 4, row: 4.8, cat: "data" },
  { id: "db_attempt", label: "AssessmentAttempt", sub: "status · score", col: 4, row: 8.7, cat: "data" },
  { id: "db_answer", label: "AssessmentAnswer", sub: "isCorrect · timeMs", col: 4, row: 9.7, cat: "data" },
  { id: "db_tracking", label: "TrackingEvent", sub: "mouse · click · vis.", col: 4, row: 10.7, cat: "data" },

  // EXTERNAL
  { id: "ext_pg", label: "PostgreSQL", sub: "Prisma ORM", col: 5, row: 4.2, cat: "external" },
  { id: "ext_openai", label: "OpenAI API", sub: "опционально", col: 5, row: 2, cat: "external" },
];

// ─── Edges ───────────────────────────────────────────────────────────────────
type Edge = { id: string; from: string; to: string; step?: number };

const EDGES: Edge[] = [
  // Admin login
  { id: "e01", from: "a_admin", to: "p_signin_admin", step: 1 },
  { id: "e02", from: "p_signin_admin", to: "act_login_a", step: 2 },
  { id: "e03", from: "act_login_a", to: "db_profile", step: 3 },
  { id: "e04", from: "act_login_a", to: "auth_sess", step: 4 },
  { id: "e05", from: "auth_sess", to: "db_asess", step: 5 },

  // Admin → dashboard (background)
  { id: "e06", from: "a_admin", to: "p_admin" },
  { id: "e07", from: "p_admin", to: "auth_req_adm" },

  // Create invitation
  { id: "e08", from: "a_admin", to: "p_interns", step: 1 },
  { id: "e09", from: "p_interns", to: "auth_req_adm", step: 2 },
  { id: "e10", from: "auth_req_adm", to: "act_create_inv", step: 3 },
  { id: "e11", from: "act_create_inv", to: "db_inv", step: 4 },
  { id: "e11b", from: "ext_openai", to: "act_create_inv" },

  // Settings
  { id: "e12", from: "a_admin", to: "p_settings", step: 1 },
  { id: "e13", from: "p_settings", to: "auth_req_adm", step: 2 },
  { id: "e14", from: "auth_req_adm", to: "act_upd_set", step: 3 },
  { id: "e15", from: "act_upd_set", to: "db_settings", step: 4 },

  // Intern login
  { id: "e16", from: "a_intern", to: "p_signin_intern", step: 1 },
  { id: "e17", from: "p_signin_intern", to: "act_login_i", step: 2 },
  { id: "e18", from: "act_login_i", to: "db_inv", step: 3 },
  { id: "e19", from: "act_login_i", to: "auth_itok", step: 4 },

  // Intern test
  { id: "e20", from: "a_intern", to: "p_test", step: 1 },
  { id: "e21", from: "p_test", to: "auth_req_int", step: 2 },
  { id: "e22", from: "auth_itok", to: "auth_req_int" },
  { id: "e23", from: "auth_req_int", to: "act_start", step: 3 },
  { id: "e24", from: "act_start", to: "db_attempt", step: 4 },
  { id: "e25", from: "p_test", to: "act_answer", step: 5 },
  { id: "e26", from: "act_answer", to: "db_answer", step: 6 },
  { id: "e27", from: "act_answer", to: "db_tracking", step: 7 },

  // Test finish
  { id: "e28", from: "p_test", to: "act_submit", step: 1 },
  { id: "e29", from: "act_submit", to: "db_attempt", step: 2 },
  { id: "e30", from: "act_submit", to: "p_result", step: 3 },

  // Track master
  { id: "e31", from: "a_tm", to: "p_signin_admin" },
  { id: "e32", from: "a_tm", to: "p_interns", step: 3 },
  { id: "e33", from: "p_interns", to: "auth_req_acc", step: 4 },
  { id: "e34", from: "auth_req_acc", to: "act_create_inv", step: 5 },

  // DB → Postgres
  { id: "e35", from: "db_profile", to: "ext_pg" },
  { id: "e36", from: "db_inv", to: "ext_pg" },
  { id: "e37", from: "db_settings", to: "ext_pg" },
];

// ─── Flows ───────────────────────────────────────────────────────────────────
type Step = { title: string; desc: string };
type Flow = {
  id: string;
  title: string;
  desc: string;
  nodes: string[];
  edges: string[];
  steps: Step[];
};

const FLOWS: Flow[] = [
  {
    id: "admin_login",
    title: "Вход администратора",
    desc: "Авторизация email+пароль, создание сессии",
    nodes: ["a_admin", "p_signin_admin", "act_login_a", "auth_sess", "db_profile", "db_asess"],
    edges: ["e01", "e02", "e03", "e04", "e05"],
    steps: [
      {
        title: "Администратор → /sign-in/admin",
        desc: "Открывает форму входа, вводит email и пароль",
      },
      {
        title: "/sign-in/admin → loginAdminAction",
        desc: "Server Action получает credentials через formData",
      },
      {
        title: "loginAdminAction → Profile DB",
        desc: "PBKDF2-SHA256 (310 000 итераций) — сравнивает хеш пароля через timingSafeEqual()",
      },
      {
        title: "loginAdminAction → Admin Session",
        desc: "Генерирует HMAC-SHA256 токен сессии, TTL 12 часов",
      },
      {
        title: "Admin Session → AdminSession DB",
        desc: "Хеш токена сохраняется в БД, устанавливается cookie qa_admin (httpOnly, sameSite=lax)",
      },
    ],
  },
  {
    id: "create_invite",
    title: "Создание приглашения",
    desc: "Генерация токена доступа для стажёра",
    nodes: ["a_admin", "p_interns", "auth_req_adm", "act_create_inv", "db_inv"],
    edges: ["e08", "e09", "e10", "e11"],
    steps: [
      {
        title: "Администратор → /admin/interns",
        desc: "Открывает раздел управления стажёрами, нажимает «Создать стажёра»",
      },
      {
        title: "/admin/interns → requireAdmin()",
        desc: "Middleware проверяет сессию и роль — только ADMIN проходит",
      },
      {
        title: "requireAdmin() → createInvitationAction",
        desc: "Выбирает трек, волну, имя кандидата. Формирует токен: Base64URL(payload) + HMAC-SHA256",
      },
      {
        title: "createInvitationAction → Invitation DB",
        desc: "В базе хранится SHA-256 хеш токена. Plaintext выдаётся администратору один раз через AES-256-GCM",
      },
    ],
  },
  {
    id: "intern_login",
    title: "Вход стажёра по токену",
    desc: "Валидация invite-токена, создание сессии",
    nodes: ["a_intern", "p_signin_intern", "act_login_i", "db_inv", "auth_itok"],
    edges: ["e16", "e17", "e18", "e19"],
    steps: [
      {
        title: "Стажёр → /sign-in/intern",
        desc: "Вводит токен приглашения (формат XXXX-XXXX-XXXX) и принимает согласие на обработку данных",
      },
      {
        title: "/sign-in/intern → loginInternByTokenAction",
        desc: "Server Action принимает токен, верифицирует HMAC-SHA256 подпись",
      },
      {
        title: "loginInternByTokenAction → Invitation DB",
        desc: "Проверяет статус инвайта (PENDING/ACCEPTED) и срок действия (expiresAt, по умолч. 14 дней)",
      },
      {
        title: "loginInternByTokenAction → Intern Token",
        desc: "Создаётся JWT-подобная сессия (cookie qa_intern, httpOnly, 14 дней). Статус инвайта → ACCEPTED",
      },
    ],
  },
  {
    id: "test_flow",
    title: "Прохождение теста",
    desc: "Запуск, ответы на вопросы, логирование",
    nodes: [
      "a_intern", "p_test", "auth_itok", "auth_req_int",
      "act_start", "act_answer",
      "db_attempt", "db_answer", "db_tracking",
    ],
    edges: ["e20", "e21", "e22", "e23", "e24", "e25", "e26", "e27"],
    steps: [
      {
        title: "Стажёр → /intern/test",
        desc: "Нажимает «Начать тест»",
      },
      {
        title: "/intern/test → requireIntern()",
        desc: "Валидирует Intern Token (HMAC), загружает профиль и проверяет активное приглашение",
      },
      {
        title: "requireIntern() → startAttemptAction",
        desc: "Создаётся AssessmentAttempt (IN_PROGRESS), запускается таймер",
      },
      {
        title: "startAttemptAction → AssessmentAttempt DB",
        desc: "Сохраняет startedAt, привязку к invitation и список вопросов трека",
      },
      {
        title: "/intern/test → submitAnswerAction",
        desc: "Каждый ответ отправляется Server Action'ом: QUIZ → selectedOption, sandbox → HTTP/SQL/autotest",
      },
      {
        title: "submitAnswerAction → AssessmentAnswer DB",
        desc: "Запись с isCorrect, timeSpentMs, submissions (для sandbox — все попытки)",
      },
      {
        title: "submitAnswerAction → TrackingEvent DB",
        desc: "Логируются mouse-move, click, keydown, visibilitychange для анти-чит анализа",
      },
    ],
  },
  {
    id: "finish_test",
    title: "Завершение теста",
    desc: "Ручная или автоматическая отправка",
    nodes: ["p_test", "act_submit", "db_attempt", "p_result"],
    edges: ["e28", "e29", "e30"],
    steps: [
      {
        title: "/intern/test → submitAttemptAction",
        desc: "Инициируется при: нажатии «Завершить», истечении таймера или уходе со вкладки (visibilitychange)",
      },
      {
        title: "submitAttemptAction → AssessmentAttempt DB",
        desc: "Статус → SUBMITTED / AUTO_SUBMITTED / EXPIRED. score = correct / scored_total × 100 (без MANUAL_QA)",
      },
      {
        title: "submitAttemptAction → /intern/result",
        desc: "Создаётся result-токен (TTL 30 мин), редирект на страницу результата",
      },
    ],
  },
  {
    id: "settings",
    title: "Управление настройками",
    desc: "Время теста и администраторы платформы",
    nodes: ["a_admin", "p_settings", "auth_req_adm", "act_upd_set", "db_settings"],
    edges: ["e12", "e13", "e14", "e15"],
    steps: [
      {
        title: "Администратор → /admin/settings",
        desc: "Страница недоступна для TRACK_MASTER — sidebar скрывает пункт, requireAdmin() блокирует доступ",
      },
      {
        title: "/admin/settings → requireAdmin()",
        desc: "Только роль ADMIN. TRACK_MASTER получает редирект",
      },
      {
        title: "requireAdmin() → updateSettingsAction",
        desc: "Изменяет лимит (1–240 мин), создаёт/редактирует/удаляет администраторов",
      },
      {
        title: "updateSettingsAction → AssessmentSettings DB",
        desc: "Новый totalTimeMinutes применяется ко всем следующим попыткам",
      },
    ],
  },
  {
    id: "track_master",
    title: "Работа трек-мастера",
    desc: "Ограниченный доступ к назначенным трекам",
    nodes: ["a_tm", "p_signin_admin", "auth_sess", "p_interns", "auth_req_acc", "act_create_inv", "db_inv"],
    edges: ["e31", "e32", "e33", "e34"],
    steps: [
      {
        title: "Трек-мастер → /sign-in/admin",
        desc: "Тот же механизм аутентификации, что и у администратора",
      },
      {
        title: "Admin Session создана (роль TRACK_MASTER)",
        desc: "Пункт «Настройки» скрыт в сайдбаре. requireAdmin() заблокирует /admin/settings",
      },
      {
        title: "Трек-мастер → /admin/interns",
        desc: "requireAdminAccess() разрешает — ADMIN или TRACK_MASTER",
      },
      {
        title: "Данные фильтруются по трекам",
        desc: "getManageableTrackIds() возвращает только назначенные треки. Стажёры других треков не отображаются",
      },
      {
        title: "createInvitationAction (ограниченно)",
        desc: "Трек-мастер может выдавать токены только в своих треках",
      },
    ],
  },
];

// ─── SVG helpers ─────────────────────────────────────────────────────────────
const nodeMap = new Map(NODES.map((n) => [n.id, n]));

function getPos(id: string) {
  const n = nodeMap.get(id);
  if (!n) return { x: 0, y: 0 };
  return { x: COL_X[n.col], y: cy(n.row) };
}

function edgePath(edge: Edge) {
  const f = getPos(edge.from);
  const t = getPos(edge.to);
  const goRight = f.x <= t.x;
  const fx = goRight ? f.x + NODE_W / 2 : f.x - NODE_W / 2;
  const tx = goRight ? t.x - NODE_W / 2 : t.x + NODE_W / 2;
  const dx = Math.abs(tx - fx) * 0.42 + 20;
  return `M${fx},${f.y} C${fx + (goRight ? dx : -dx)},${f.y} ${tx - (goRight ? dx : -dx)},${t.y} ${tx},${t.y}`;
}

function midPoint(edge: Edge) {
  const f = getPos(edge.from);
  const t = getPos(edge.to);
  return { x: (f.x + t.x) / 2, y: (f.y + t.y) / 2 };
}

// ─── Component ───────────────────────────────────────────────────────────────
export function ServiceArchitectureDiagram() {
  const [selectedFlow, setSelectedFlow] = useState<string | null>(null);

  const flow = FLOWS.find((f) => f.id === selectedFlow) ?? null;
  const activeNodes = new Set(flow?.nodes ?? []);
  const activeEdges = new Set(flow?.edges ?? []);

  const nodeOpacity = (id: string) => (flow ? (activeNodes.has(id) ? 1 : 0.13) : 0.8);
  const edgeOpacity = (id: string) => (flow ? (activeEdges.has(id) ? 1 : 0.06) : 0.35);
  const isActiveEdge = (id: string) => !!flow && activeEdges.has(id);
  const isActiveNode = (id: string) => !!flow && activeNodes.has(id);

  return (
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 48px)",
        background: "#111213",
        color: "#eee",
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: 12,
        overflow: "hidden",
      }}
    >
      {/* ── Diagram area ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowX: "auto", overflowY: "auto", padding: "14px 0 14px 14px" }}>
        {/* Legend */}
        <div style={{ display: "flex", gap: 14, paddingLeft: 6, marginBottom: 12, flexWrap: "wrap" }}>
          {LEGEND.map((l) => (
            <div key={l.cat} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 2,
                  background: CAT_COLOR[l.cat],
                  flexShrink: 0,
                }}
              />
              <span style={{ color: "#666", fontSize: 10 }}>{l.label}</span>
            </div>
          ))}
        </div>

        <svg width={SVG_W} height={SVG_H} style={{ display: "block" }}>
          {/* Column headers */}
          {COLUMNS.map((label, i) => (
            <text
              key={i}
              x={COL_X[i]}
              y={22}
              textAnchor="middle"
              fill="#444"
              fontSize={9}
              fontFamily="system-ui, sans-serif"
              letterSpacing="0.1em"
              fontWeight="700"
            >
              {label}
            </text>
          ))}

          {/* Column separators */}
          {COLUMNS.slice(1).map((_, i) => {
            const x = (COL_X[i] + COL_X[i + 1]) / 2;
            return (
              <line key={i} x1={x} y1={34} x2={x} y2={SVG_H - 8} stroke="#1c1c1c" strokeWidth={1} />
            );
          })}

          {/* Edges */}
          {EDGES.map((edge) => {
            const active = isActiveEdge(edge.id);
            const opacity = edgeOpacity(edge.id);
            const color = active ? "#f0c040" : "#555";
            const mp = edge.step ? midPoint(edge) : null;
            const arrowTarget = getPos(edge.to);
            const goRight = getPos(edge.from).x <= arrowTarget.x;
            const arrowX = goRight ? arrowTarget.x - NODE_W / 2 : arrowTarget.x + NODE_W / 2;

            return (
              <g key={edge.id} opacity={opacity}>
                <path
                  d={edgePath(edge)}
                  fill="none"
                  stroke={color}
                  strokeWidth={active ? 2 : 1}
                  strokeLinecap="round"
                />
                {active && (
                  <circle cx={arrowX} cy={arrowTarget.y} r={3.5} fill="#f0c040" />
                )}
                {edge.step && mp && (
                  <g>
                    <circle cx={mp.x} cy={mp.y} r={9} fill="#111213" stroke={color} strokeWidth={1} />
                    <text
                      x={mp.x}
                      y={mp.y + 4}
                      textAnchor="middle"
                      fill={color}
                      fontSize={9}
                      fontFamily="system-ui, sans-serif"
                      fontWeight="700"
                    >
                      {edge.step}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {NODES.map((node) => {
            const nx = COL_X[node.col] - NODE_W / 2;
            const ny = cy(node.row) - NODE_H / 2;
            const color = CAT_COLOR[node.cat];
            const active = isActiveNode(node.id);
            const opacity = nodeOpacity(node.id);
            const borderColor = active ? "#f0c040" : color;
            const labelColor = active ? "#f0c040" : "#ccc";

            return (
              <g key={node.id} opacity={opacity}>
                <rect
                  x={nx}
                  y={ny}
                  width={NODE_W}
                  height={NODE_H}
                  rx={5}
                  fill={active ? "#1e1a0a" : "#181a1c"}
                  stroke={borderColor}
                  strokeWidth={active ? 1.8 : 1}
                />
                <text
                  x={COL_X[node.col]}
                  y={ny + (node.sub ? 17 : 25)}
                  textAnchor="middle"
                  fill={labelColor}
                  fontSize={10}
                  fontFamily="ui-monospace, 'Courier New', monospace"
                  fontWeight={active ? "700" : "500"}
                >
                  {node.label}
                </text>
                {node.sub && (
                  <text
                    x={COL_X[node.col]}
                    y={ny + 31}
                    textAnchor="middle"
                    fill="#555"
                    fontSize={8.5}
                    fontFamily="system-ui, sans-serif"
                  >
                    {node.sub}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── Right panel ──────────────────────────────────────────────────── */}
      <div
        style={{
          width: 292,
          borderLeft: "1px solid #1e1e1e",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          flexShrink: 0,
          background: "#141516",
        }}
      >
        {/* Flows list */}
        <div
          style={{
            overflowY: "auto",
            borderBottom: "1px solid #1e1e1e",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              padding: "14px 16px 8px",
              color: "#444",
              fontSize: 9,
              letterSpacing: "0.12em",
              fontWeight: 700,
            }}
          >
            СЦЕНАРИИ
          </div>
          {FLOWS.map((f) => {
            const isActive = selectedFlow === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setSelectedFlow(isActive ? null : f.id)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "9px 16px",
                  background: isActive ? "#1c190a" : "transparent",
                  border: "none",
                  borderLeft: `3px solid ${isActive ? "#f0c040" : "transparent"}`,
                  cursor: "pointer",
                  color: isActive ? "#f0c040" : "#aaa",
                  transition: "all 0.12s",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "#181818";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 2 }}>{f.title}</div>
                <div style={{ fontSize: 10, color: isActive ? "#a07820" : "#555" }}>{f.desc}</div>
              </button>
            );
          })}
          {selectedFlow && (
            <button
              onClick={() => setSelectedFlow(null)}
              style={{
                display: "block",
                width: "100%",
                padding: "7px 16px",
                background: "transparent",
                border: "none",
                color: "#444",
                fontSize: 10,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              ✕ &nbsp;Сбросить выбор
            </button>
          )}
        </div>

        {/* Steps */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {flow ? (
            <>
              <div
                style={{
                  padding: "12px 16px 8px",
                  color: "#444",
                  fontSize: 9,
                  letterSpacing: "0.12em",
                  fontWeight: 700,
                }}
              >
                ШАГИ
              </div>
              {flow.steps.map((step, i) => (
                <div
                  key={i}
                  style={{ padding: "8px 16px 10px", borderBottom: "1px solid #1a1a1a" }}
                >
                  <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                    <div
                      style={{
                        minWidth: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "#f0c040",
                        color: "#111",
                        fontSize: 9,
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <div
                        style={{
                          color: "#ccc",
                          fontWeight: 600,
                          fontSize: 11,
                          marginBottom: 3,
                          fontFamily: "ui-monospace, monospace",
                          lineHeight: 1.35,
                        }}
                      >
                        {step.title}
                      </div>
                      <div style={{ color: "#666", fontSize: 10, lineHeight: 1.55 }}>
                        {step.desc}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div style={{ padding: "20px 16px", color: "#383838", fontSize: 11, lineHeight: 1.7 }}>
              Выберите сценарий, чтобы подсветить путь через систему и увидеть подробные шаги.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
