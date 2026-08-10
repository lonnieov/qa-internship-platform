# Admin Performance Safe Optimizations Verification

## Preconditions

- Local PostgreSQL is running and seeded.
- Admin user can sign in.
- There is at least one track, one wave, one question, and one intern or invitation.

## Smoke Check

1. Open `/ru/admin/tracks`.
2. Expected: tracks list loads, summary cards show totals, track expand/collapse works.
3. Open `/ru/admin/interns`.
4. Expected: interns table loads, search works, candidate modal opens.
5. Open `/ru/admin/questions`.
6. Expected: question bank loads, type chips and track filters work.

## Positive Case

1. On `/ru/admin/tracks`, expand a track with waves.
2. Expected: questions, invites, interns, attempts, completed count, average result, and wave stats are visible.
3. On `/ru/admin/questions`, switch between tracks and question types.
4. Expected: counts and visible cards match the selected track and type.
5. On `/ru/admin/interns`, open an intern profile.
6. Expected: tokens and attempts are visible, result links still work.

## Negative Cases

1. Open `/ru/admin/questions?track=unknown`.
2. Expected: page falls back to the allowed default behavior without crashing.
3. Search interns with a value that has no matches.
4. Expected: empty state is shown.

## Regression Check

1. Create or edit a question from the admin questions page.
2. Expected: form still submits and returns to the bank.
3. Create a new intern token.
4. Expected: token appears and can be copied.
5. Update a track or wave.
6. Expected: page revalidates and updated values are visible.
