# Bilingual Question Authoring

## Purpose

Admins add question content in Russian and Uzbek from one question form.

## Scope

- Question creation and editing show language tabs for RU and UZ.
- Quiz answer options store Russian and Uzbek text.
- Intern test pages use Uzbek question and option text on the `uz` locale.
- Existing questions without Uzbek text continue to fall back to Russian.

## Data Model

- `Question.text` remains the Russian primary text.
- `Question.textUz` stores the Uzbek question text.
- `QuestionOption.text` remains the Russian option text.
- `QuestionOption.textUz` stores the Uzbek option text.
- Sandbox question configs may include `missionUz` for localized mission display.

## Main Flow

- Admin opens `app/[locale]/admin/questions/page.tsx`.
- `components/admin/question-form.tsx` renders RU/UZ tabs.
- `src/actions/admin.ts` validates and persists both language fields.
- `app/[locale]/intern/test/page.tsx` chooses Uzbek text when `locale` is `uz`.

## Touched Files

- `prisma/schema.prisma`
- `src/actions/admin.ts`
- `src/lib/prisma.ts`
- `components/admin/question-form.tsx`
- `app/[locale]/admin/questions/page.tsx`
- `app/[locale]/intern/test/page.tsx`
- `app/globals.css`
- `messages/ru.json`
- `messages/uz.json`
- `docs/features/bilingual-question-authoring/README.md`
- `docs/features/bilingual-question-authoring/VERIFY.md`

## Constraints

- Uzbek fields are nullable for backward compatibility with existing data.
- New and edited questions require both RU and UZ text server-side.
- The selected correct option is shared across languages.
