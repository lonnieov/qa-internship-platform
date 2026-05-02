# Admin Localization Verification

## Preconditions

- local dev server is running
- both `ru` and `uz` locales are available
- at least one admin attempt exists

## Smoke Check

1. Open `/ru/admin`, `/ru/admin/settings`, `/ru/admin/questions`, `/ru/admin/attempts/<attemptId>`.
Expected result: pages render without runtime errors.
2. Open `/uz/admin`, `/uz/admin/settings`, `/uz/admin/questions`, `/uz/admin/attempts/<attemptId>`.
Expected result: page titles, descriptions and main table headers are shown in Uzbek.
3. Open `/uz/sign-in/admin`.
Expected result: role tabs, hero copy, form labels and password visibility button are shown in Uzbek.

## Positive Case

1. On `/ru/admin/attempts/<attemptId>`, inspect the "Время по вопросам" table.
Expected result: `Время` and `Результат` headers stay horizontal and their cells do not collapse into vertical letters.
2. On `/uz/admin/questions`, open the create-question modal and track-manage modal.
Expected result: modal title, close label and primary actions are translated to Uzbek.
3. On `/uz/admin/settings`, open admin manage modal.
Expected result: edit/delete labels are translated to Uzbek.
4. On `/uz/admin/questions`, open create-question or edit-question form for each available type.
Expected result: field labels inside quiz, SQL, DevTools and manual QA sections are translated and use the same terminology as the rest of the admin panel.
5. On `/uz/admin/interns`, issue a retake token.
Expected result: retake action button and success panel text are translated to Uzbek.

## Negative Cases

1. Open an attempt with long question text.
Expected result: long text wraps inside the question/answer columns without shrinking the time/result columns into unreadable stacks.
2. Switch locale on admin pages after opening a modal.
Expected result: modal copy stays in the selected locale and does not mix Russian and Uzbek labels.

## Regression Check

1. On `/ru/admin/interns`, reveal/copy a token.
Expected result: copy hint still works and copied state is shown.
2. On `/ru/admin/questions`, delete confirmation still appears before question deletion.
Expected result: question is deleted only after confirmation.
