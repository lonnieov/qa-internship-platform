# Track Management Verification

## Preconditions

- Run `npm run db:push` after pulling the schema change.
- Run the app locally.
- Sign in as an admin.
- Open `/admin/questions`.

## Smoke Check

- Expected: the sidebar shows `Все треки` and database-backed tracks.
- Expected: each track shows a question count and a `...` management button.
- Click a track `...` button.
- Expected: a centered edit modal opens over the page and the sidebar layout does not shift.
- Expected: the add-question modal shows active tracks in `Классификация`.

## Positive Case

- In the track sidebar, enter `Backend` in `Новый трек` and submit.
- Expected: `Backend` appears in the sidebar with `0` questions.
- Open `Добавить`, create a Quiz question in `Backend`, and submit.
- Expected: the new question appears when `Backend` is selected.
- Open the `Backend` `...` modal, rename it to `Backend QA`, and submit.
- Expected: the sidebar label changes and the existing question remains in that track.

## Negative Cases

- Try to submit an empty new-track name.
- Expected: browser required-field validation blocks submission.
- Try to delete a track that has questions.
- Expected: delete is disabled and the track remains.
- Hide a track from the `...` menu.
- Expected: the track remains in the sidebar but is not offered for new questions.

## Regression Check

- Open `/admin/questions?type=QUIZ&track=qa`.
- Expected: the QA filter still works for existing default questions.
- Edit an existing question and save without changing its type.
- Expected: the question remains visible and keeps a track.
- Start an intern attempt.
- Expected: the test runner still shows question track labels.
