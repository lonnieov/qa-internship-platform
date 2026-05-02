# Internationalization Verification

## Preconditions

- App is running with the current database.
- Admin user can open `/admin/interns`.
- Intern token exists and can open the assessment start page.

## Smoke Check

1. Open `/admin/interns`.
2. Expected: page redirects to `/ru/admin/interns`.
3. Use the language switcher and select Uzbek.
4. Expected: URL changes to `/uz/admin/interns` and admin navigation plus interns page labels switch to Uzbek.
5. Open the intern start page in Russian and switch to Uzbek.
6. Expected: URL changes to `/uz/intern` and start-page labels switch to Uzbek.

## Positive Case

1. Open `/ru/admin/interns?query=али`.
2. Switch language to Uzbek.
3. Expected: URL becomes `/uz/admin/interns?query=али`.
4. Expected: the search input keeps `али`, and the empty state/table labels use Uzbek text.
5. Create a new intern from the modal.
6. Expected: modal copy explains that a token is created immediately, and the created token is still shown once.
7. Log in as intern, start or continue a test, and switch language on the test page.
8. Expected: URL keeps `?attempt=...`, and navigation, progress, finish dialog, and comment dialog labels use the selected language.

## Negative Cases

1. Open `/en/admin/interns`.
2. Expected: route is not accepted as a supported locale.
3. Open `/uz/admin/interns?query=unlikely-search-value`.
4. Expected: centered empty state appears with Uzbek text and reset action.

## Regression Check

1. In Russian, sort each interns table column.
2. Expected: sorting still works.
3. Open an intern row modal.
4. Expected: token mask hover/copy, retake token creation, attempts, and result links still work.
5. Switch back to Russian.
6. Expected: current admin page remains open and translated labels return to Russian.
7. Finish an intern attempt and switch language on the result page.
8. Expected: answer summary, token notice, and next-step timeline labels switch language without showing the attempt identifier.
