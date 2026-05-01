# Question Comment Verification

## Preconditions

- Admin has at least one active question.
- Intern has an in-progress token-based attempt.

## Smoke Check

- Open `/intern/test`.
- Expected: the old `Отметить` button is replaced by `Комментировать` in the question header.
- Click `Комментировать`.
- Expected: a dialog opens with a textarea and `Сохранить`.

## Positive Case

- Enter `Нет правильного ответа: фото не грузится после выбора авто`.
- Click `Сохранить`.
- Expected: dialog closes and the header button changes to `Комментарий`.
- Navigate to another question and back.
- Expected: the saved text is still in the comment dialog.
- Finish the test and open the admin attempt report.
- Expected: that question shows `Комментарий стажёра` with the exact saved text.
- Download the Markdown report.
- Expected: the same comment appears in the answer text for that question.

## Negative Cases

- Open the comment dialog, clear the textarea, and click `Сохранить`.
- Expected: the question no longer has a comment marker, and the admin report does not show `Комментарий стажёра`.
- Let the attempt expire or submit it, then try to return to `/intern/test`.
- Expected: the comment can no longer be edited because the active test page is unavailable.

## Regression Check

- Save a normal quiz answer after saving a comment.
- Expected: selected answer remains saved and the comment remains visible in the admin report.
- For Manual QA, add a bug report after saving a comment.
- Expected: bug reports and `Комментарий стажёра` both appear in the admin report.
