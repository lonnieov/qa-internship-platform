# QA Internship Validator

Next.js App Router проект для ассессмента кандидатов на QA-стажировку.

## Стек

- Next.js App Router
- TypeScript
- Prisma + PostgreSQL
- Clerk для production admin auth
- demo admin auth для локального запуска
- Tailwind CSS и локальные UI-компоненты
- OpenAI Responses API для опциональной генерации вопросов

## Что Умеет Проект

- Админ создаёт стажёра и выдаёт токен.
- Стажёр входит только по токену, без email и без регистрации.
- Токен хранится только как SHA-256 hash.
- Админ управляет банком вопросов.
- Поддерживаются `QUIZ`, `API_SANDBOX` и `DEVTOOLS_SANDBOX`.
- Для попытки действует общий таймер.
- Результат считается как `correct / total * 100`.
- Проходной балл сейчас фиксирован на `100%`.
- После завершения токен аннулируется для повторного входа.
- Сохраняются ответы, время на вопросы и tracking events.

## Требования

- Node.js `20+`
- npm `10+`
- PostgreSQL `14+`

## Быстрый Старт

1. Установите зависимости:

```bash
npm install
```

2. Создайте локальный env-файл:

```bash
cp .env.example .env
```

3. Заполните обязательные переменные в `.env`:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/qa_internship_validator?schema=public"
DEMO_ADMIN_ENABLED=true
DEMO_ADMIN_SESSION_SECRET=change-me-demo-admin-session-secret
INTERN_SESSION_SECRET=change-me-intern-session-secret
```

4. Подготовьте базу:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

5. Запустите dev-сервер:

```bash
npm run dev
```

6. Откройте `http://localhost:3000`.

## Переменные Окружения

Минимум для локального запуска:

- `DATABASE_URL` - строка подключения к PostgreSQL
- `DEMO_ADMIN_ENABLED=true` - включает локальный admin login без Clerk
- `DEMO_ADMIN_SESSION_SECRET` - secret для demo admin cookie
- `INTERN_SESSION_SECRET` - secret для intern session cookie

Опционально:

- `OPENAI_API_KEY` - нужен только для AI-подсказок или генерации вопросов
- `OPENAI_MODEL` - модель для OpenAI integration
- `ADMIN_EMAILS` - список production admin email-ов для Clerk
- `NEXT_PUBLIC_CLERK_*` и `CLERK_SECRET_KEY` - нужны только если реально используется Clerk flow

Важно:

- Для локального demo-входа Clerk keys не обязательны.
- Если `DEMO_ADMIN_ENABLED=false`, локальный вход `admin/admin` работать не будет.

## Локальные Входы

Администратор:

- URL: `http://localhost:3000/sign-in/admin`
- логин: `admin`
- пароль: `admin`

Стажёр:

- URL: `http://localhost:3000/sign-in/intern`
- токен выдаётся из админки после создания кандидата

## PostgreSQL

Пример локального `DATABASE_URL`:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/qa_internship_validator?schema=public"
```

Если база пустая, достаточно:

```bash
npm run db:push
npm run db:seed
```

Если меняли Prisma schema:

```bash
npm run db:generate
npm run db:push
```

Для просмотра данных:

```bash
npm run db:studio
```

## Основные Скрипты

```bash
npm run dev
npm run build
npm run build:deploy
npm run lint
npm run db:generate
npm run db:push
npm run db:migrate
npm run db:seed
npm run db:studio
```

## Деплой

Build command:

```bash
npm run build:deploy
```

Для production:

- задайте production `DATABASE_URL`
- отключите `DEMO_ADMIN_ENABLED`
- настройте Clerk keys, если нужен Clerk admin login

## Полезные Маршруты

- `/` - главная
- `/sign-in/admin` - вход администратора
- `/sign-in/intern` - вход стажёра
- `/admin` - админ-панель
- `/admin/interns` - стажёры и токены
- `/admin/questions` - банк вопросов
- `/admin/settings` - настройки теста
- `/intern` - стартовая страница стажёра
