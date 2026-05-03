# SQL Sandbox

## Purpose

Добавляет в банк вопросов отдельный тип `SQL_SANDBOX` для задач на написание SQL-запросов по связанным таблицам.

## Scope

- админ может создавать и редактировать SQL sandbox-вопросы
- стажёр видит SQL workspace с редактором/результатом слева и diagram-панелью таблиц справа
- SQL-запрос выполняется в изолированной временной SQLite-базе
- перед выполнением запрос проверяется парсером `node-sql-parser`
- результат сверяется с эталонным набором колонок и строк
- админ видит отправленный запрос и краткий итог в отчёте по попытке

## Data Model

- `prisma/schema.prisma`
  - `QuestionType` расширен значением `SQL_SANDBOX`
- `Question.apiConfig`
  - хранит `mode`, `taskTitle`, `mission`, `dialect`, `tables`, `expectedResult`
  - `dialect` сейчас фиксирован как `SQLite` и не настраивается из админки
- `AssessmentAnswer.apiRequest`
  - хранит `mode: "SQL_SANDBOX"` и отправленный `query`
- `AssessmentAnswer.apiResponse`
  - хранит `ok`, `columns`, `rows`, `error`

## Main Flow

1. Админ выбирает чипсу `SQL Sandbox` в `app/admin/questions/page.tsx`.
2. Форма в `components/admin/question-form.tsx` принимает описание, таблицы и ожидаемый результат.
3. Стажёр открывает вопрос в `components/intern/test-runner.tsx`, пишет запрос и нажимает `Выполнить`.
4. `src/actions/intern.ts` запускает проверку через `src/lib/sql-sandbox.ts`.
5. `src/lib/sql-sandbox.ts` сначала валидирует синтаксис SQL и проверяет, что используются только таблицы из задания.
6. Ответ и результат сохраняются в `AssessmentAnswer`, после чего вопрос считается отвеченным.
7. Админ видит SQL-ответ в `app/[locale]/admin/attempts/[attemptId]/page.tsx` и Markdown-отчёте.

- в заголовке SQL-редактора показывается только контекст движка и статус проверки, без шильдиков ожидаемых колонок
- правая панель показывает диаграмму таблиц со связями, выбором активной таблицы и pan/zoom управлением
- sample data выбранной таблицы вынесены в отдельный компактный preview под диаграммой

## Touched Files

- `prisma/schema.prisma`
- `src/actions/admin.ts`
- `src/actions/intern.ts`
- `src/lib/sql-sandbox.ts`
- `package.json`
- `src/lib/question-order.ts`
- `components/admin/question-form.tsx`
- `components/admin/question-create-modal.tsx`
- `components/intern/test-runner.tsx`
- `app/globals.css`
- `app/[locale]/admin/questions/page.tsx`
- `app/[locale]/admin/attempts/[attemptId]/page.tsx`
- `src/lib/attempt-report-md.ts`

## Constraints

- разрешён только один `SELECT` или `WITH` запрос
- DDL/DML и мультистейтментные запросы запрещены
- использовать можно только таблицы, переданные в конфиге задания
- выполнение идёт на SQLite in-memory, а не на реальном Postgres проекта
- сравнение результата не зависит от порядка строк и порядка колонок
