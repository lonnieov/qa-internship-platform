# Intern Profile Search

## Purpose

Help admins quickly find intern profiles by full name.

## Scope

- Adds a search field to the `Профили стажёров` block on `/admin/interns`.
- Filters intern profiles by `InternProfile.fullName`.
- Keeps token history and token creation unchanged.

## Main Flow

- Admin opens `/admin/interns`.
- Admin enters a first name, last name, or full name in `Поиск по ФИО`.
- Page reloads with `q=<search>` and shows matching intern profiles.
- Admin can clear the search with `Сбросить`.

## Touched Files

- `app/admin/interns/page.tsx`
- `app/globals.css`
- `docs/features/intern-profile-search/README.md`
- `docs/features/intern-profile-search/VERIFY.md`

## Constraints

- Search is server-side.
- Search does not filter `Последние токены`.
