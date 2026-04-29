# V2 UI Plan

## Goal

Deliver a new frontend UI layer inside the current codebase without blocking on
unfinished backend features.

## Principles

- keep the existing Next.js and Prisma foundation
- replace the visible UI progressively, not by rewrite
- use real backend where it already exists
- show explicit `In progress` overlays where backend is missing
- avoid changing domain logic and UI in the same step unless required

## Phase 1: Foundation

- define v2 page shell for admin and intern areas
- extract reusable design tokens from the new visual direction
- build shared layout pieces: sidebar, topbar, stats cards, table shell, modal,
  empty state, `In progress` overlay
- keep current routes and data contracts where possible

## Phase 2: Pages With Existing Backend

- redesign `/sign-in/admin`
- redesign `/sign-in/intern`
- redesign `/admin`
- redesign `/admin/interns`
- redesign `/admin/questions`
- redesign `/admin/settings`
- redesign `/intern`
- redesign `/intern/test`
- redesign `/intern/result`

## Phase 3: Partial UI With Overlay

These screens can be built visually first and connected later:

- advanced admin dashboard filters and richer metrics
- candidate creation modal with extra profile fields
- richer results analytics and heatmap visualization
- manual review surfaces for non-quiz tasks

For these screens:

- render real page layout
- connect any available data
- cover unfinished panels with `In progress`
- make placeholders visually explicit, not broken-looking

## Phase 4: New Backend Capabilities

- track-based assessment composition
- login/password flow for interns if product decides to move away from token-only
- manual grading model
- bug-detection task type
- documentation-review task type
- richer results and review entities

## Page Order

1. auth pages
2. admin shell
3. admin interns
4. intern shell
5. intern test
6. questions and settings
7. results and advanced review screens

## Technical Notes

- keep route structure stable unless product flow requires a change
- prefer server components for read-only page composition
- keep interactive test flows in client components
- isolate mock data to dedicated view-model helpers or temporary fixtures
- avoid coupling temporary placeholders to future schema details

## Definition Of Done Per Screen

- matches the new visual direction closely
- responsive on desktop and mobile where applicable
- does not break current auth or navigation
- unfinished blocks are covered by `In progress`
- no dead controls without explanation

## Immediate Next Steps

1. implement shared v2 layout primitives
2. redesign both sign-in pages
3. redesign admin dashboard and interns page
4. redesign intern start and test pages
5. add overlay component for unsupported backend sections
