# Bilingual Question Authoring Verification

## Preconditions

- Admin can sign in.
- At least one active track exists.
- Database schema has been applied from `prisma/schema.prisma`.

## Smoke Check

1. Open `/ru/admin/questions`.
2. Click `Добавить`.
3. Verify the form shows language tabs `Русский` and `O‘zbekcha`.
4. Switch between tabs.
5. Expected result: the question textarea changes language context without losing the other tab.

## Positive Case

1. Create a Quiz question.
2. In `Русский`, enter question `Что проверяет smoke testing?`.
3. Enter RU options:
   - `Быстрая проверка критичного функционала`
   - `Полная регрессия`
   - `Нагрузочное тестирование`
   - `Только визуальная проверка`
4. Mark option A as correct.
5. Switch to `O‘zbekcha`.
6. Enter question `Smoke testing nimani tekshiradi?`.
7. Enter UZ options:
   - `Kritik funksionalni tez tekshirish`
   - `To‘liq regressiya`
   - `Yuklama testi`
   - `Faqat vizual tekshiruv`
8. Save the question.
9. Open the question bank.
10. Expected result: the card shows the Russian question and Uzbek translation, with both texts for options.
11. Start an intern attempt on `/uz`.
12. Expected result: the intern sees the Uzbek question and Uzbek options.

## Negative Cases

1. Try to create a Quiz question with RU text and empty Uzbek text.
2. Expected result: the question is not created.
3. Try to create a Quiz question with an empty Uzbek option.
4. Expected result: the question is not created.

## Regression Check

1. Open an existing question that has no Uzbek text.
2. Start an intern attempt on `/ru`.
3. Expected result: Russian questions and options still render normally.
4. Start an intern attempt on `/uz` with an older question.
5. Expected result: missing Uzbek fields fall back to Russian text.
