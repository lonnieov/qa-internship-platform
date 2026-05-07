# Multi-Track Refactor

## Purpose

Prepare the QA assessment service for multiple internship directions.

Terminology:

- `Track` = direction: QA, HR, Mobile, Backend, Frontend.
- `Wave` = internship stream inside a track.
- `TRACK_MASTER` = future track manager role.

## Scope

Implemented:

- schema support for `TRACK_MASTER`, `TrackMember`, and `Wave`;
- invitations, intern profiles, attempts store `trackId` and `waveId`;
- assessment settings can be global, track-level, or wave-level;
- intern question loading is scoped by intern track when assigned;
- invitation form assigns a selected wave;
- admin can manage tracks, waves, track masters, and track stats from `/admin/tracks`;
- track masters can sign in via admin login;
- dashboard, interns, questions, attempts, reports are scoped for track masters;
- non-QA tracks are blocked from practical question types server-side.

## Data Model

Changed `prisma/schema.prisma`:

- `Role`: added `TRACK_MASTER`.
- Added `TrackMember`.
- Added `Wave`.
- Added `trackId`, `waveId` to `Invitation`, `InternProfile`, `AssessmentAttempt`.
- Added `trackId`, `waveId` to `AssessmentSettings`.

Default tracks are now directions: QA, HR, Mobile, Backend, Frontend.
Seed creates one track master for each default track with password `TrackMaster123`.
Legacy API/gRPC/Web tracks are treated as QA task categories during migration helpers.

## Main Flow

- Admin opens `/admin/tracks` and creates tracks, waves, and track masters.
- Track master signs in through admin login.
- Track master sees only assigned tracks.
- Admin/track master creates an invitation for a selected wave.
- Intern accepts token; profile receives invitation `trackId` and `waveId`.
- Intern starts test; active questions are filtered by assigned track.
- Attempt stores same `trackId` and `waveId`.

## Touched Files

- `prisma/schema.prisma`
- `prisma/seed.ts`
- `src/lib/tracks.ts`
- `src/lib/waves.ts`
- `src/lib/assessment.ts`
- `src/lib/question-classification.ts`
- `src/lib/question-type-policy.ts`
- `src/actions/admin.ts`
- `src/actions/intern.ts`
- `app/[locale]/admin/interns/page.tsx`
- `app/[locale]/intern/page.tsx`
- `components/admin/invitation-create-modal.tsx`
- `components/admin/invitation-form.tsx`
- `components/admin/admin-shell.tsx`
- `app/[locale]/admin/page.tsx`
- `app/[locale]/admin/settings/page.tsx`
- `app/[locale]/admin/tracks/page.tsx`
- `app/[locale]/admin/questions/page.tsx`
- `app/[locale]/admin/attempts/[attemptId]/page.tsx`
- `app/[locale]/admin/attempts/[attemptId]/md/route.ts`
- `app/api/admin/attempts/[attemptId]/ai-overview/route.ts`
- `app/api/admin/attempts/[attemptId]/ai-answer-reviews/route.ts`
- `src/lib/auth.ts`
- `src/lib/admin-auth.ts`
- `src/actions/admin-auth.ts`

## Constraints

- `Question.track` legacy string remains for compatibility.
- Practical task types are allowed only for QA track.
