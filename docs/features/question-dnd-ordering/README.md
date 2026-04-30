# Question Drag Ordering

## Purpose

Allow admins to reorder questions with drag-and-drop from the question bank.

## Scope

- Adds drag handles to question cards in `/admin/questions`.
- Saves the dropped order into `Question.order`.
- Revalidates admin question pages after ordering changes.

## Data Model

- Uses existing `Question.order`.
- No schema changes were made.

## Main Flow

- Admin opens `/admin/questions`.
- Admin selects a question type and optional track.
- Admin drags a question card by the handle.
- On drop, the visible order is saved.

## Touched Files

- `app/admin/questions/page.tsx`
- `components/admin/sortable-question-list.tsx`
- `src/actions/admin.ts`
- `app/globals.css`
- `docs/features/question-dnd-ordering/README.md`
- `docs/features/question-dnd-ordering/VERIFY.md`

## Constraints

- Ordering is saved for the visible question list.
- Drag-and-drop does not change question type or track.
