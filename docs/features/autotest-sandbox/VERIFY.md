# Autotest Sandbox Verification

## Preconditions

- App is running.
- Admin user can sign in.
- At least one active track exists.
- There is an intern token that can start an assessment containing an Autotest question.

## Smoke Check

1. Open `/ru/admin/questions?type=AUTOTEST_SANDBOX`.
2. Expected: Autotest question section is available.
3. Create or use an Autotest question with preset `ClickAvto / Тонировка`.
4. Sign in as intern and start the assessment.
5. Navigate to the Autotest question.
6. Expected: the right panel shows `Псевдокод`, the mission text, `Пример структуры`, and the editor.
7. Expected: `Пример структуры` contains only abstract placeholders and does not include a ready `ClickAvto` payment scenario.

## Positive Case

1. In the Autotest editor, type:
   `test('Проверка', () => { navigateTo('ClickAvto') })`
2. Expected: the `Пример структуры` block remains visible above the editor while text is present.
3. Click `Сохранить ответ`.
4. Expected: save status changes to `Сохранено`.
5. Navigate away and back to the Autotest question.
6. Expected: saved pseudocode is still in the editor and `Пример структуры` is still visible.

## Negative Cases

1. Clear all text from the editor.
2. Expected: save button is disabled and `Пример структуры` remains visible.

## Regression Check

1. Open a non-Autotest question.
2. Expected: no Autotest example structure block is shown.
3. Complete the assessment.
4. Expected: result flow still opens normally.
