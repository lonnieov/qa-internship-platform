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

### Admin Creates Installment Widget Task

1. Open `/admin/questions?type=MANUAL_QA_SANDBOX`.
2. Click `Добавить`.
3. Select preset `ClickSuperApp / Рассрочка`.
4. Expected result: mission changes to the Shishka payment flow, viewport is `390` x `844`, categories include `boundary`, `state`, and `modal`.
5. Expected result: known bugs JSON includes `installment-max-boundary-hidden`.
6. Click `Добавить вопрос`.
7. Expected result: the question card shows preset `click-super-app-installment-widget-v1`.

### Intern Completes Task

1. Issue or reuse an intern token.
2. Sign in as intern and start the attempt.
3. Navigate to the `Manual QA` question.
4. Expected result: the question shows an interactive ClickAvto mobile miniapp.
5. Expected result: the Manual QA page uses the expanded assessment layout and the phone viewport is visible without looking like a desktop web page.
6. Click through saved car, service selection, promo code, protection toggle, payment, and back navigation.
7. Click `Добавить баг`.
8. Fill:
   - title: `Промокод применяется повторно`
   - severity: `critical`
   - category: `calculation`
   - steps: `1. Открыть ClickAvto\n2. Ввести AVTO15\n3. Нажать OK два раза`
   - actual: `Скидка применяется два раза`
   - expected: `Промокод применяется только один раз`
9. Click `Сохранить ответ`.
10. Expected result: badge changes to `ответ сохранён` and navigation marks the question as answered.

### Intern Checks Installment Widget

1. Create or use a Manual QA question with preset `ClickSuperApp / Рассрочка`.
2. Start an intern attempt and open that question.
3. Enter `1000` and click `Continue`.
4. Expected result: the confirmation screen shows the Deferred payment widget with a toggle and `?` button.
5. Expected result: the confirmation screen fits the embedded phone area with compact native-mobile proportions and no internal phone scroll.
6. Toggle the widget on and off.
7. Expected result: the UI allows activation and deactivation.
8. Click `?`.
9. Expected result: a bottom sheet with deferred payment information appears.
10. Return to amount input, enter `500`, and continue.
11. Expected result: the Deferred payment widget is not rendered.
12. Return to amount input, enter `200000`, and continue.
13. Expected result: this is a valid boundary case that should be checked by the tester.

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

5. Open the create modal.
6. Set viewport width to `100`.
7. Submit.
8. Expected result: the saved config clamps width to `320`.

## Regression Check

1. Open `/admin/questions?type=QUIZ`.
2. Create a regular quiz question.
3. Expected result: quiz creation still works.

4. Open `/admin/questions?type=API_SANDBOX`.
5. Create an API Sandbox question.
6. Expected result: API Sandbox creation still works.

7. Complete an attempt with only auto-scored question types.
8. Expected result: score calculation remains based on quiz choice, API Sandbox, and DevTools Sandbox answers.
