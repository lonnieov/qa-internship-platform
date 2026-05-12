# Multi-Track Refactor Verification

## Preconditions

- PostgreSQL `DATABASE_URL` is configured.
- Run `npm run db:push` after schema changes.
- Run `npm run db:seed` if local database is empty.
- Sign in as admin.

## Smoke Check

1. Open `/admin/interns`.
2. Click create intern/invitation.
3. Verify the form shows a `Wave` selector with options like `QA / Wave 1`.
4. Create an invitation for `QA / Wave 1` with candidate name `Ali Valiyev`.
5. Expected: token is created and shown once.

## Positive Case

1. Open `/admin/tracks` as admin.
2. Create a new wave for QA, e.g. `QA Wave 2`.
3. Add a track master in QA with email `qa-master@example.com`, password `secret123`, or use seeded `qa-master@example.com` / `TrackMaster123`.
4. Sign out and sign in as `qa-master@example.com`.
5. Expected: only assigned track data is visible; platform admin sections are hidden.
6. Create an invitation for `QA / QA Wave 2`.
7. Use the created token on intern sign-in page.
8. Accept personal data consent.
9. Start assessment.
10. Expected: intern can start test and attempt is created.
11. Check database manually if needed:
   - `Invitation.trackId` and `Invitation.waveId` are filled;
   - `InternProfile.trackId` and `InternProfile.waveId` are filled;
   - `AssessmentAttempt.trackId` and `AssessmentAttempt.waveId` are filled.

## Negative Cases

1. Sign in as a QA-only track master.
2. Try to open an attempt from another track by URL.
3. Expected: not found/forbidden.
4. Open admin questions.
5. Select a non-QA track, e.g. HR.
6. Try to submit a practical task type through a crafted form request.
7. Expected: server redirects to quiz view and does not create non-QA practical question.

## Regression Check

1. Existing QA invitation flow still creates a token.
2. Existing intern token login still works.
3. Existing global settings still apply when no wave/track settings exist.
4. Existing QA questions are still available for QA interns.
