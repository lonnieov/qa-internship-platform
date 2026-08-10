# Admin Performance Safe Optimizations

## Purpose

Reduce database load on admin pages without changing user-facing behavior.

## Scope

- Admin tracks page uses aggregate queries instead of per-track and per-wave query loops.
- Admin interns page fetches only fields required for the table, modal, tokens, and attempts.
- Admin questions page filters selected track in Prisma and uses grouped counts for track badges.

## Data Model

No schema changes.

## Main Flow

- Admin opens tracks, interns, or questions pages.
- Server components load the same visible data with narrower selects and fewer queries.
- Existing actions, forms, filters, modals, and navigation remain unchanged.

## Touched Files

- `app/[locale]/admin/tracks/page.tsx`
- `app/[locale]/admin/interns/page.tsx`
- `app/[locale]/admin/questions/page.tsx`
- `docs/features/admin-performance-safe-optimizations/README.md`
- `docs/features/admin-performance-safe-optimizations/VERIFY.md`

## Constraints

- No connection pooling changes in this patch.
- No SQL sandbox runtime changes in this patch.
- No client component split or UI redesign in this patch.
