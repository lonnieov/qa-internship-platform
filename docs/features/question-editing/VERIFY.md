# Question Editing Verification

## Preconditions

- Run the app locally.
- Log in as admin.
- Have at least one question in each type: Quiz, API Sandbox, and DevTools Sandbox.

## Smoke Check

- Open `Банк вопросов`.
- Expected: every existing question has a `Редактировать` expandable panel.
- Expand the panel.
- Expected: fields are prefilled with the current question values.
- Expected: JSON body fields highlight keys, strings, numbers, literals, and punctuation.

## Positive Case

- Edit a Quiz question text, one answer option, and the correct radio option.
- Click `Сохранить изменения`.
- Expected: the card displays the new text and correct option border moves to the selected option.
- Edit an API Sandbox question response body with valid JSON.
- Expected: the JSON preview in the card updates after saving.
- Edit a DevTools Sandbox expected answer.
- Expected: the JSON preview keeps the updated `expectedAnswer`.

## Negative Cases

- Put invalid JSON into an API body field and save.
- Expected: the question is not updated.
- Clear required fields and save.
- Expected: browser validation or server validation prevents a broken question.

## Regression Check

- Create a new question with the existing `Новый вопрос` form.
- Toggle an existing question active/hidden.
- Delete a disposable question.
- Expected: create, toggle, and delete still work.
