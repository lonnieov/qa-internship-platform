# Answer Submission History

## Purpose

Сохраняет отдельную историю отправок по вопросам с повторными сабмитами, чтобы админ видел не только итоговый ответ, но и все предыдущие версии.

## Scope

- история отправок создаётся отдельно от `AssessmentAnswer`
- итоговый `AssessmentAnswer` остаётся агрегированной записью для скоринга, навигации и быстрого чтения
- история показывается в админском отчёте по попытке
- история попадает в Markdown-экспорт отчёта
- сейчас история пишется для `OPEN_QUIZ`, `API_SANDBOX`, `SQL_SANDBOX`, `DEVTOOLS_SANDBOX`, `MANUAL_QA_SANDBOX`, `AUTOTEST_SANDBOX`

## Data Model

- `prisma/schema.prisma`
  - добавлена модель `AssessmentAnswerSubmission`
- `AssessmentAnswerSubmission`
  - `answerId`
  - `submissionIndex`
  - `kind`
  - `requestPayload`
  - `responsePayload`
  - `isCorrect`
  - `timeSpentMs`
  - `submittedAt`
- `AssessmentAnswer`
  - хранит текущее агрегированное состояние ответа
  - связан с `submissions`

## Main Flow

1. Стажёр отправляет ответ повторно.
2. Server action сохраняет новую запись в `AssessmentAnswerSubmission`.
3. Тот же action обновляет агрегированную запись `AssessmentAnswer`.
4. Админ открывает `/admin/attempts/<attemptId>`.
5. В строке вопроса раскрывается `История отправок`, где видны все отправки по порядку.
6. При скачивании Markdown история отправок тоже попадает в отчёт.

## Touched Files

- `prisma/schema.prisma`
- `src/actions/intern.ts`
- `app/[locale]/admin/attempts/[attemptId]/page.tsx`
- `src/lib/attempt-report-md.ts`
- `messages/ru.json`
- `messages/uz.json`

## Constraints

- `AssessmentAnswer` остаётся основным источником для навигации и итогового результата
- история не должна ломать текущую таблицу отчёта, поэтому рендерится в раскрывающемся блоке
- для SQL агрегированная запись сохраняет последний корректный результат и не затирается последующим неудачным запуском
