# AI Overview Verification

## Preconditions

- Run the app locally.
- Sign in as an administrator.
- Have at least one submitted assessment attempt.
- Set `GROQ_API_KEY` in `.env`.

## Smoke Check

- Open `/ru/admin/attempts/<attemptId>`.
- Expected: `Ai overview` appears next to `Скачать MD`.
- Click `Ai overview`.
- Expected: overlay opens and shows loading state.

## Positive Case

- Wait for Groq response.
- Expected: overlay shows a Russian overview with candidate result, strengths, risks, timing, and recommendation.
- Press `Escape` or click outside the overlay.
- Expected: overlay closes without leaving the attempt report page.

## Negative Cases

- Remove `GROQ_API_KEY`.
- Click `Ai overview`.
- Expected: overlay shows a clear configuration error.

- Log out from admin.
- Send `POST /api/admin/attempts/<attemptId>/ai-overview`.
- Expected: request is blocked by admin auth.

## Regression Check

- Click `Скачать MD`.
- Expected: Markdown download still works.
- Reopen the attempt report page.
- Expected: score, timing, answer table, and manual review controls still render normally.
