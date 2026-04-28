# QA Internship Validator

Next.js App Router проект для ассессмента кандидатов на QA-стажировку.

## Стек

- Next.js App Router, TypeScript, Vercel
- Clerk Auth для админов, token-only вход для стажёров
- Prisma 7 style client + `@prisma/adapter-libsql`
- Turso SQLite/libSQL, локально `file:./prisma/dev.db`
- shadcn/ui-style компоненты и Coin design tokens
- OpenAI Responses API для опциональных подсказок вопросов

## Локальный запуск

1. Установить зависимости:

```bash
npm install
```

2. Создать `.env` из `.env.example`. Для demo-админки Clerk keys не нужны.

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

Откройте `http://localhost:3000`. Для админки в локальном `.env` включён
demo-вход:

- логин: `admin`
- пароль: `admin`

Страница входа: `http://localhost:3000/sign-in/admin`.

## Роли и доступы

Админ создаётся автоматически после входа через Clerk, если email есть в
`ADMIN_EMAILS`, либо входит через локальный demo-доступ `admin/admin`.
Стажёр не регистрируется по почте: админ вводит имя и фамилию, система выдаёт
токен, а стажёр входит только по этому токену. Токен хранится только как
SHA-256 hash.

Для локального тестирования есть отдельный demo-admin вход `admin/admin`. Его
пароль хранится в `.env` как PBKDF2-SHA256 hash, а сессия - в httpOnly cookie.
В production установите `DEMO_ADMIN_ENABLED=false` или не задавайте эти переменные.

## Turso

Для локальной разработки используется `DATABASE_URL="file:./prisma/dev.db"`.
Для Vercel/Turso задайте:

```bash
TURSO_DATABASE_URL="libsql://..."
TURSO_AUTH_TOKEN="..."
DATABASE_URL="file:./prisma/dev.db"
```

`TURSO_DATABASE_URL` имеет приоритет в runtime-клиенте. Prisma CLI при миграциях
использует `DATABASE_URL`; для remote Turso миграции удобнее применять через
Turso CLI, если Prisma Migrate несовместим с HTTP-подключением в вашей версии.

## Что реализовано

- Выдача токенов стажёрам из админки.
- Вход стажёров по токену без email.
- Банк вопросов: 4 варианта, один правильный, активность вопроса.
- Настройка общего времени на тест.
- Старт попытки, дедлайн, автозавершение при истечении времени.
- Только одна попытка на стажёра, без ретрая.
- Свободная навигация между вопросами до завершения.
- Подсчёт процента: `correct / total * 100`, проходной балл 100%.
- Финальный экран результата с процентом прохождения.
- После завершения теста токен получает статус `COMPLETED`, сессия стажёра
  очищается, повторный вход по токену невозможен.
- Логирование движений курсора, кликов, клавиш, visibility/focus/blur и навигации.
- Сохранение времени на каждый вопрос и выбранного ответа.
- Детализация попытки для администратора.
