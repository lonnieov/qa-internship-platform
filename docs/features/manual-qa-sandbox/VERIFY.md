# Manual QA Sandbox Verification

## Preconditions

- Database schema is updated with `prisma db push` or equivalent migration.
- Admin user can sign in.
- At least one active track exists.

## Smoke Check

1. Open `/admin/questions`.
2. Click the `Manual QA` tab.
3. Expected result: the page shows the Manual QA section and an `Добавить` button.

## Positive Case

### Admin Creates Task

1. Open `/admin/questions?type=MANUAL_QA_SANDBOX`.
2. Click `Добавить`.
3. Keep preset `ClickSuperApp / ClickAvto`.
4. Use mission: `Проверьте miniapp ClickAvto внутри ClickSuperApp: выбор авто, услуга, промокод, оплата и возврат назад.`
5. Keep viewport `390` x `844`.
6. Keep known bugs JSON unchanged.
7. Click `Добавить вопрос`.
8. Expected result: admin returns to the Manual QA section with `created=1`.
9. Expected result: the new question card shows preset `click-super-app-click-avto-v1`, viewport `390x844`, and known bug count.

### Intern Completes Task

1. Issue or reuse an intern token.
2. Sign in as intern and start the attempt.
3. Navigate to the `Manual QA` question.
4. Expected result: the question shows an interactive ClickAvto mobile miniapp.
5. Click through saved car, service selection, promo code, protection toggle, payment, and back navigation.
6. Click `Добавить баг`.
7. Fill:
   - title: `Промокод применяется повторно`
   - severity: `critical`
   - category: `calculation`
   - steps: `1. Открыть ClickAvto\n2. Ввести AVTO15\n3. Нажать OK два раза`
   - actual: `Скидка применяется два раза`
   - expected: `Промокод применяется только один раз`
8. Click `Сохранить ответ`.
9. Expected result: badge changes to `ответ сохранён` and navigation marks the question as answered.

### Admin Reviews Result

1. Finish the intern attempt.
2. Open the attempt from `/admin/interns`.
3. Expected result: the Manual QA row shows bug count, severity, category, steps, actual, expected, and `ручная проверка`.
4. Download PDF.
5. Expected result: PDF includes the Manual QA bug report text.

## Negative Cases

1. Open the create modal.
2. Replace `Known bugs rubric` with `{}`.
3. Submit.
4. Expected result: the question is not created because known bugs must be an array.

1. Open the create modal.
2. Set viewport width to `100`.
3. Submit.
4. Expected result: the saved config clamps width to `320`.

## Regression Check

1. Open `/admin/questions?type=QUIZ`.
2. Create a regular quiz question.
3. Expected result: quiz creation still works.

1. Open `/admin/questions?type=API_SANDBOX`.
2. Create an API Sandbox question.
3. Expected result: API Sandbox creation still works.

1. Complete an attempt with only auto-scored question types.
2. Expected result: score calculation remains based on quiz choice, API Sandbox, and DevTools Sandbox answers.
