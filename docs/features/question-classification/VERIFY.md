# Question Classification Verification

## Preconditions

- App is running locally.
- Admin can sign in with the configured admin credentials.
- Database has at least one active question.

## Smoke Check

1. Open `/admin/questions`.
2. Switch between `Quiz`, `API Sandbox`, and `DevTools`.
3. Click each track in the left rail.
4. Expected: the list filters without errors, each question card shows track/type chips, and no create form is visible inline.

## Positive Case

1. Open the `Quiz` section and click `Добавить`.
2. Create a Quiz question with track `Mobile`.
3. Open the created question edit panel.
4. Change the track to `Web` and save.
5. Start an intern test with a token.
6. Expected: the question appears with the `Web` chip, answer cards are selectable, navigation marks answered questions, and local flagging changes the navigator state.

## Negative Cases

1. Create a question with an empty text field.
2. Expected: the question is not created.
3. Create a DevTools question without expected answer fields.
4. Expected: the question is not created.

## Regression Check

1. Sign in as an intern using an access token.
2. Start and finish the test.
3. Expected: token login still works, the result remains a percentage of correct answers, and no passing score is shown.
4. Open `/admin/settings`.
5. Expected: only total time is configurable; passing score is not displayed.
