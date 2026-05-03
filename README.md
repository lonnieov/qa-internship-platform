# QA Internship Validator

Next.js App Router проект для ассессмента кандидатов на QA-стажировку.

## Стек

- Next.js App Router, TypeScript, Vercel
- DB auth для админов, token-only вход для стажёров
- Prisma 7 style client + `@prisma/adapter-pg`
- PostgreSQL через `DATABASE_URL`
- shadcn/ui-style компоненты и Coin design tokens
- OpenAI Responses API для опциональных подсказок вопросов
- Groq Chat API для AI overview по MD-отчётам попыток

## Локальный запуск

1. Установить зависимости:

```bash
npm install
```

2. Создать `.env` из `.env.example` и указать PostgreSQL `DATABASE_URL`.

3. Подготовить БД:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

4. Запустить:

```bash
npm run dev
```

Откройте `http://localhost:3000`. Страница входа администратора:
`http://localhost:3000/sign-in/admin`. Первый аккаунт администратора создаётся
на `http://localhost:3000/sign-up/admin`.

## Роли и доступы

Админ регистрируется и входит по email и паролю. Пароль хранится в базе как
PBKDF2-SHA256 hash, активные админ-сессии хранятся в таблице `AdminSession`.
Если задан `ADMIN_REGISTRATION_CODE`, регистрация новых админов требует этот
код.
Стажёр не регистрируется по почте: админ вводит имя и фамилию, система выдаёт
токен, а стажёр входит только по этому токену. Токен хранится только как
SHA-256 hash.

## PostgreSQL

Приложение использует PostgreSQL. В `.env` и на сервере задайте:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

Для Render/другого хостинга используйте external PostgreSQL URL. После смены
переменной окружения примените схему:

```bash
npm run db:push
```

Для деплоя можно использовать build command:

```bash
npm run build:deploy
```

## AI overview

Для сводки результатов через Groq задайте на сервере:

```bash
GROQ_API_KEY=
GROQ_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
GROQ_BASE_URL=https://api.groq.com/openai/v1
```

Кнопка `Ai overview` доступна на странице результата попытки рядом со
скачиванием MD-отчёта.

## Что реализовано

- Выдача токенов стажёрам из админки.
- Вход стажёров по токену без email.
- Банк вопросов: классификация по трекам, 4 варианта, один правильный, активность вопроса.
- Настройка общего времени на тест.
- Старт попытки, дедлайн, автозавершение при истечении времени.
- Только одна попытка на стажёра, без ретрая.
- Свободная навигация между вопросами до завершения.
- Подсчёт процента: `correct / total * 100`.
- Финальный экран результата с процентом прохождения.
- После завершения теста токен получает статус `COMPLETED`, сессия стажёра
  очищается, повторный вход по токену невозможен.
- Сохранение времени на каждый вопрос и выбранного ответа.
- Автозавершение теста при уходе со вкладки.
- Детализация попытки для администратора.
