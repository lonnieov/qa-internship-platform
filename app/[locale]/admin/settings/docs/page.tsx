import { requireAdmin } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

const SERVICE_DOCS = {
  service: "QA Internship Validator",
  version: "1.0.0",
  description:
    "Платформа автоматизированной оценки кандидатов на позицию QA-стажёра. Поддерживает несколько треков (QA, HR, Mobile, Backend, Frontend), волны найма, ролевую модель доступа и шесть типов вопросов.",
  roles: [
    {
      id: "ADMIN",
      name: "Администратор",
      description: "Полный доступ ко всем функциям платформы.",
    },
    {
      id: "TRACK_MASTER",
      name: "Трек-мастер",
      description:
        "Управляет назначенными треками: приглашениями, вопросами, попытками. Не имеет доступа к настройкам платформы.",
    },
    {
      id: "INTERN",
      name: "Стажёр",
      description:
        "Проходит тестирование по приглашению. Одна попытка на приглашение.",
    },
  ],
  questionTypes: [
    {
      id: "QUIZ",
      name: "Quiz",
      description: "Вопрос с четырьмя вариантами ответа, один верный. Работает во всех треках.",
      tracks: ["ALL"],
    },
    {
      id: "API_SANDBOX",
      name: "API Sandbox",
      description: "Кандидат формирует HTTP-запрос и проверяет ответ по сценарию.",
      tracks: ["QA"],
    },
    {
      id: "SQL_SANDBOX",
      name: "SQL Sandbox",
      description: "Кандидат пишет SQL-запрос, результат проверяется автоматически.",
      tracks: ["QA"],
    },
    {
      id: "DEVTOOLS_SANDBOX",
      name: "DevTools Sandbox",
      description: "Инструмент разработчика в браузере: перехват и анализ сетевых запросов.",
      tracks: ["QA"],
    },
    {
      id: "MANUAL_QA_SANDBOX",
      name: "Manual QA Sandbox",
      description:
        "Ручное тест-задание с пресетами сценариев. Результат оценивается ревьювером вручную.",
      tracks: ["QA"],
    },
    {
      id: "AUTOTEST_SANDBOX",
      name: "Autotest Sandbox",
      description: "Автотестовый фреймворк: написание и запуск автотестов прямо в браузере.",
      tracks: ["QA"],
    },
  ],
  scenarios: [
    {
      id: "admin_login",
      title: "Вход администратора / трек-мастера",
      actors: ["ADMIN", "TRACK_MASTER"],
      entry: "/sign-in/admin",
      steps: [
        "Открыть /sign-in/admin",
        "Ввести email и пароль",
        "Сервер проверяет PBKDF2-SHA256 хеш пароля (310 000 итераций)",
        "Создаётся сессия с HMAC-SHA256 токеном, TTL 12 часов",
        "Cookie qa_admin устанавливается как httpOnly",
        "Редирект на /admin (дашборд)",
      ],
      outcome: "Администратор авторизован, открыт дашборд",
      errorCases: [
        "Неверные учётные данные → ошибка 401, форма остаётся",
        "Истёкшая сессия → редирект на /sign-in/admin",
      ],
    },
    {
      id: "admin_dashboard",
      title: "Просмотр дашборда",
      actors: ["ADMIN", "TRACK_MASTER"],
      entry: "/admin",
      steps: [
        "Загрузка агрегированной статистики: число стажёров, активных вопросов, завершённых попыток",
        "Отображение последних попыток с результатами",
        "Для TRACK_MASTER — только данные назначенных треков",
      ],
      outcome: "Обзор состояния платформы",
      errorCases: [],
    },
    {
      id: "intern_invitation",
      title: "Создание приглашения для стажёра",
      actors: ["ADMIN", "TRACK_MASTER"],
      entry: "/admin/interns",
      steps: [
        "Выбрать трек и волну",
        "Заполнить имя кандидата (опционально)",
        "Сервер генерирует invite-код: Base64URL-payload + HMAC-SHA256 подпись",
        "В базе хранится только SHA-256 хеш кода",
        "Администратор копирует токен и передаёт кандидату",
        "Срок действия токена — INTERN_INVITATION_EXPIRES_IN_DAYS (по умолчанию 14 дней)",
      ],
      outcome: "Токен скопирован, кандидат может войти в систему",
      errorCases: [
        "Трек/волна не выбраны → ошибка валидации",
        "Токен можно отозвать до входа кандидата (статус REVOKED)",
      ],
    },
    {
      id: "intern_login",
      title: "Вход стажёра по токену",
      actors: ["INTERN"],
      entry: "/sign-in/intern",
      steps: [
        "Ввести токен приглашения (формат XXXX-XXXX-XXXX)",
        "Принять согласие на обработку персональных данных",
        "Сервер верифицирует HMAC-SHA256 подпись токена",
        "Проверяет статус приглашения (должен быть PENDING или ACCEPTED)",
        "Проверяет срок действия (expiresAt)",
        "Создаётся JWT-подобная сессия (cookie qa_intern, TTL 14 дней)",
        "Статус приглашения меняется на ACCEPTED",
        "Редирект на онбординг или домашнюю страницу",
      ],
      outcome: "Стажёр авторизован, доступ к тесту открыт",
      errorCases: [
        "Неверный токен → ошибка",
        "Истёкший токен → ошибка",
        "Токен уже использован (COMPLETED/REVOKED) → ошибка",
      ],
    },
    {
      id: "intern_test",
      title: "Прохождение теста",
      actors: ["INTERN"],
      entry: "/intern/test",
      steps: [
        "Стажёр нажимает «Начать тест»",
        "Создаётся запись AssessmentAttempt со статусом IN_PROGRESS",
        "Запускается таймер (totalTimeMinutes из настроек)",
        "Стажёр отвечает на вопросы в произвольном порядке",
        "Каждый ответ сохраняется как AssessmentAnswer (QUIZ) или AssessmentAnswerSubmission (sandbox)",
        "Пользовательские события (клики, фокус, видимость) логируются в TrackingEvent",
        "При уходе со вкладки (visibility change) тест авто-отправляется",
        "По истечению таймера тест авто-отправляется",
        "Стажёр может вручную завершить тест кнопкой «Отправить»",
        "Итоговый статус: SUBMITTED / AUTO_SUBMITTED / EXPIRED",
      ],
      outcome: "Попытка завершена, результат вычислен",
      errorCases: [
        "Потеря соединения → ответы сохраняются при следующей отправке",
        "Повторная попытка заблокирована (одна попытка на приглашение)",
      ],
    },
    {
      id: "intern_result",
      title: "Просмотр результата",
      actors: ["INTERN"],
      entry: "/intern/result",
      steps: [
        "После завершения создаётся временный result-токен (TTL 30 минут)",
        "Страница показывает итоговый процент (верные / все оценённые вопросы)",
        "MANUAL_QA вопросы исключены из автоматического подсчёта",
        "Доступ к результату — только через result-токен (одноразовый)",
      ],
      outcome: "Стажёр видит итоговый балл",
      errorCases: ["Result-токен истёк → редирект на домашнюю страницу"],
    },
    {
      id: "attempt_review",
      title: "Ревью попытки администратором",
      actors: ["ADMIN", "TRACK_MASTER"],
      entry: "/admin/attempts/[attemptId]",
      steps: [
        "Открыть детальный отчёт попытки",
        "Просмотреть все ответы, время на каждый вопрос, треккинг-события",
        "Для MANUAL_QA_SANDBOX: заполнить форму ручной оценки (комментарий и балл)",
        "Скачать отчёт в формате Markdown (кнопка «Скачать»)",
        "Создать повторное приглашение (retake), если кандидат должен пересдать",
      ],
      outcome: "Попытка оценена, решение по кандидату принято",
      errorCases: [
        "TRACK_MASTER не видит попытки из чужих треков",
      ],
    },
    {
      id: "question_management",
      title: "Управление вопросами",
      actors: ["ADMIN", "TRACK_MASTER"],
      entry: "/admin/questions",
      steps: [
        "Создать вопрос: выбрать тип, трек, ввести текст и варианты",
        "Для QUIZ — 4 варианта, один верный (или open-quiz с кастомной оценкой)",
        "Для API/SQL/DevTools/ManualQA/Autotest — настроить JSON-конфигурацию сандбокса",
        "Опционально: сгенерировать вопрос через OpenAI (кнопка AI)",
        "Изменить порядок вопросов перетаскиванием",
        "Деактивировать вопрос (флаг active = false) — не попадёт в тест",
        "Удалить вопрос",
      ],
      outcome: "Банк вопросов актуализирован",
      errorCases: [
        "API/SQL/DevTools/ManualQA/Autotest недоступны для не-QA треков",
        "OpenAI недоступен без OPENAI_API_KEY",
      ],
    },
    {
      id: "track_wave_management",
      title: "Управление треками и волнами",
      actors: ["ADMIN"],
      entry: "/admin/tracks",
      steps: [
        "Создать трек (QA, HR, Mobile, Backend, Frontend или кастомный)",
        "Добавить трек-мастера к треку",
        "Создать волну (название, даты начала и окончания)",
        "Активировать/деактивировать волну",
        "Волна определяет группу кандидатов одного набора",
      ],
      outcome: "Структура треков и волн настроена",
      errorCases: [
        "TRACK_MASTER не имеет доступа к этой функциональности в полном объёме",
      ],
    },
    {
      id: "settings_management",
      title: "Управление настройками платформы",
      actors: ["ADMIN"],
      entry: "/admin/settings",
      steps: [
        "Изменить глобальный лимит времени на тест (1–240 минут, по умолчанию 30)",
        "Создать нового администратора (email, пароль мин. 6 символов, имя опционально)",
        "Редактировать существующего администратора",
        "Удалить администратора (нельзя удалить текущего и seed-администратора)",
      ],
      outcome: "Настройки платформы обновлены",
      errorCases: [
        "TRACK_MASTER не имеет доступа к этой странице",
        "Seed-администратор (admin@resting.chat) защищён от изменений",
      ],
    },
    {
      id: "track_master_flow",
      title: "Работа трек-мастера",
      actors: ["TRACK_MASTER"],
      entry: "/admin",
      steps: [
        "Вход через /sign-in/admin (те же механизмы, что и у администратора)",
        "Доступ к дашборду, стажёрам, трекам, вопросам — только по назначенным трекам",
        "Создание приглашений только в своих треках",
        "Проверка попыток только своих стажёров",
        "Управление вопросами только своих треков",
        "Страница настроек /admin/settings — недоступна (редирект)",
      ],
      outcome: "Трек-мастер управляет своим треком независимо",
      errorCases: [
        "Попытка открыть /admin/settings → редирект",
        "Попытка просмотреть данные чужого трека → пустой результат или 403",
      ],
    },
  ],
  scoring: {
    description: "Формула подсчёта результата",
    formula: "score = (correctAnswers / scoredQuestions) * 100",
    scoredTypes: ["QUIZ (не open-quiz)", "API_SANDBOX", "SQL_SANDBOX", "DEVTOOLS_SANDBOX", "AUTOTEST_SANDBOX"],
    excludedTypes: ["MANUAL_QA_SANDBOX (ручная оценка ревьювером)"],
    attemptStatuses: [
      { status: "IN_PROGRESS", description: "Тест начат, таймер идёт" },
      { status: "SUBMITTED", description: "Стажёр вручную нажал «Завершить»" },
      { status: "AUTO_SUBMITTED", description: "Автоотправка при уходе со вкладки" },
      { status: "EXPIRED", description: "Таймер истёк" },
    ],
  },
  security: {
    adminPasswords: "PBKDF2-SHA256, 310 000 итераций, индивидуальная соль",
    adminSessions: "HMAC-SHA256 токен, TTL 12 ч, httpOnly cookie",
    internTokens: "Base64URL payload + HMAC-SHA256 подпись, TTL 14 дней",
    inviteCodes: "SHA-256 хеш в БД, AES-256-GCM шифрование в ответе",
    timingAttack: "timingSafeEqual() для всех сравнений токенов",
    antiCheat: "Авто-отправка при visibilitychange (уход со вкладки)",
  },
};

type Scenario = (typeof SERVICE_DOCS.scenarios)[number];

function ScenarioCard({ scenario }: { scenario: Scenario }) {
  const actorColors: Record<string, string> = {
    ADMIN: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    TRACK_MASTER: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    INTERN: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">{scenario.title}</CardTitle>
            <code className="text-xs text-muted-foreground">{scenario.entry}</code>
          </div>
          <div className="flex gap-1 flex-wrap shrink-0">
            {scenario.actors.map((actor) => (
              <span
                key={actor}
                className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${actorColors[actor] ?? ""}`}
              >
                {actor}
              </span>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <ol className="space-y-1 text-sm">
          {scenario.steps.map((step, i) => (
            <li key={i} className="flex gap-2">
              <span className="shrink-0 text-muted-foreground w-5 text-right">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <div className="rounded-md bg-muted px-3 py-2 text-sm">
          <span className="font-medium">Результат: </span>
          {scenario.outcome}
        </div>
        {scenario.errorCases.length > 0 && (
          <ul className="space-y-1 text-sm text-muted-foreground">
            {scenario.errorCases.map((ec, i) => (
              <li key={i} className="flex gap-2">
                <span className="shrink-0">⚠</span>
                <span>{ec}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default async function ServiceDocsPage() {
  await requireAdmin();

  const generatedAt = new Date().toISOString();
  const docsWithTimestamp = { ...SERVICE_DOCS, generatedAt };
  const rawJson = JSON.stringify(docsWithTimestamp, null, 2);

  return (
    <main className="page stack-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="head-1 flex items-center gap-2">
            <FileText size={24} />
            Документация сервиса
          </h1>
          <p className="body-1 muted m-0">
            Описание основных сценариев работы платформы. Только для администраторов.
          </p>
        </div>
        <Badge variant="outline" className="shrink-0 mt-1">
          v{SERVICE_DOCS.version}
        </Badge>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>О сервисе</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">{SERVICE_DOCS.description}</p>
          <div>
            <p className="text-sm font-medium mb-2">Роли пользователей</p>
            <div className="space-y-2">
              {SERVICE_DOCS.roles.map((role) => (
                <div key={role.id} className="flex gap-3 text-sm">
                  <code className="shrink-0 font-semibold w-28">{role.id}</code>
                  <span className="text-muted-foreground">{role.description}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Типы вопросов</p>
            <div className="space-y-2">
              {SERVICE_DOCS.questionTypes.map((qt) => (
                <div key={qt.id} className="flex gap-3 text-sm">
                  <code className="shrink-0 font-semibold w-32">{qt.id}</code>
                  <span className="text-muted-foreground">
                    {qt.description}{" "}
                    <span className="text-xs">
                      ({qt.tracks.join(", ")})
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scenarios */}
      <div>
        <h2 className="head-2 mb-4">Сценарии</h2>
        <div className="space-y-4">
          {SERVICE_DOCS.scenarios.map((scenario) => (
            <ScenarioCard key={scenario.id} scenario={scenario} />
          ))}
        </div>
      </div>

      {/* Scoring */}
      <Card>
        <CardHeader>
          <CardTitle>Оценка результата</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <span className="font-medium">Формула: </span>
            <code className="bg-muted px-2 py-0.5 rounded">{SERVICE_DOCS.scoring.formula}</code>
          </div>
          <div>
            <span className="font-medium">Учитываются в оценке: </span>
            {SERVICE_DOCS.scoring.scoredTypes.join(", ")}
          </div>
          <div>
            <span className="font-medium">Исключены: </span>
            {SERVICE_DOCS.scoring.excludedTypes.join(", ")}
          </div>
          <div>
            <p className="font-medium mb-1">Статусы попытки</p>
            <div className="space-y-1">
              {SERVICE_DOCS.scoring.attemptStatuses.map((s) => (
                <div key={s.status} className="flex gap-3">
                  <code className="shrink-0 w-28">{s.status}</code>
                  <span className="text-muted-foreground">{s.description}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle>Безопасность</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {Object.entries(SERVICE_DOCS.security).map(([key, value]) => (
            <div key={key} className="flex gap-3">
              <code className="shrink-0 text-muted-foreground w-36">{key}</code>
              <span>{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Raw JSON */}
      <Card>
        <CardHeader>
          <CardTitle>JSON (машиночитаемый формат)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-auto rounded-md bg-muted p-4 text-xs leading-relaxed max-h-[500px]">
            {rawJson}
          </pre>
        </CardContent>
      </Card>
    </main>
  );
}
