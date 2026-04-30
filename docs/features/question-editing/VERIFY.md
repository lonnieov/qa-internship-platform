# Question Editing Verification

## Preconditions

- Run the app locally.
- Log in as admin.
- Have at least one question in each type: Quiz, API Sandbox, and DevTools Sandbox.

## Smoke Check

- Open `Банк вопросов`.
- Create a new question in any section.
- Expected: after submit the page stays in the same section and shows a short success popup.
- Expected: every existing question has a `Редактировать` expandable panel.
- Expand the panel.
- Expected: fields are prefilled with the current question values.
- Expected: JSON body fields highlight keys, strings, numbers, literals, and punctuation.

## Positive Case

- Edit a Quiz question text, one answer option, and the correct radio option.
- Click `Сохранить изменения`.
- Expected: the card displays the new text and correct option border moves to the selected option.
- Switch a Quiz question to `Открытый ответ`, leave `Эталонный ответ` empty, and save.
- Expected: the question is saved successfully and the card still marks it as an open question.
- Fill `Эталонный ответ` for the same question and save again.
- Expected: the card shows the hint as reviewer guidance, not as an auto-check rule.
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
- Pass a multiple-choice quiz question in the intern flow.
- Pass an open-answer quiz question in the intern flow.
- Expected: the answer is saved, the attempt report shows `без оценки` for that question, and the final score is calculated only from auto-graded questions.
