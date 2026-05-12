# Track Management

## Purpose

Let admins manage question tracks inside the question bank sidebar.

## Scope

- `/admin/questions` shows tracks from the database.
- Admins can create, rename, reorder, activate, hide, and delete empty tracks.
- Track editing opens in a centered modal with separated edit and status/delete sections.
- Question create and edit forms use active database tracks.
- Existing string question tracks remain as a fallback for old records.

## Data Model

- `Track`: stores `slug`, `name`, `isActive`, and `order`.
- `Question.trackId`: optional relation to `Track`.
- `Question.track`: retained as legacy fallback text for existing data.

## Main Flow

- Admin opens `/admin/questions`.
- Sidebar lists all tracks with question counts.
- Admin creates a new track from the sidebar input.
- Admin opens a track modal from the `...` button.
- Admin edits name/order in the primary section or uses the status/delete section for visibility and removal.
- Admin creates or edits a question and selects an active track.

## Touched Files

- `prisma/schema.prisma`
- `prisma/seed.ts`
- `src/actions/admin.ts`
- `src/lib/tracks.ts`
- `src/lib/question-classification.ts`
- `src/lib/prisma.ts`
- `app/admin/questions/page.tsx`
- `app/intern/test/page.tsx`
- `components/admin/question-form.tsx`
- `components/admin/question-create-modal.tsx`
- `components/admin/track-manage-modal.tsx`
- `app/globals.css`
- `.gitignore`
- `src/generated/prisma/*`

## Constraints

- Tracks with questions cannot be deleted from the sidebar.
- Hidden tracks remain visible to admins but are not offered for new questions.
- Existing questions without `trackId` are linked to default tracks when the question bank loads.
