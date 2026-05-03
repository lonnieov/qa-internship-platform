# AI Answer Review

## Purpose

Show an AI-generated review for answers that require manual assessment.

## Scope

- Supported answer types: open quiz, Manual QA, Autotest.
- Report page auto-generates missing AI reviews through Groq after opening.
- AI review is stored in `AssessmentAnswer.apiResponse.aiReview`.
- Admin still makes the final decision through manual review controls.

## Data Model

- `AssessmentAnswer.apiResponse.aiReview` stores provider, model, verdict, score, summary, strengths, issues, recommendation, and generated timestamp.
- `AssessmentAnswer.apiResponse.adminReview` continues to store the final admin decision.

## Main Flow

- Admin opens an attempt report.
- Client detects missing AI reviews for reviewable answers.
- `POST /api/admin/attempts/<attemptId>/ai-answer-reviews` generates missing reviews through Groq.
- Page refreshes and shows each AI review in a compact row with the manual review form under the answer.
- Admin accepts or rejects the answer manually.

## Touched Files

- `app/[locale]/admin/attempts/[attemptId]/page.tsx`
- `app/api/admin/attempts/[attemptId]/ai-answer-reviews/route.ts`
- `components/admin/attempt-ai-reviews-loader.tsx`
- `components/admin/answer-ai-review-card.tsx`
- `src/lib/ai-answer-review.ts`
- `src/lib/groq-client.ts`
- `src/lib/attempt-report-md.ts`
- `src/actions/admin.ts`
- `messages/ru.json`
- `messages/uz.json`
- `app/globals.css`

## Constraints

- `GROQ_API_KEY` must be configured.
- AI review is advisory; admin review is the final assessment.
- Generation uses only the stored task config and intern answer.
- Existing cached AI reviews are reused and not regenerated automatically.
