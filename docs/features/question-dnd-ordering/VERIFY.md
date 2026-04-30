# Question Drag Ordering Verification

## Preconditions

- Run the app locally.
- Sign in as admin.
- Have at least two questions in the same visible question section.

## Smoke Check

- Open `/admin/questions`.
- Expected: each question card has a drag handle near the left edge.

## Positive Case

- Drag the second visible question above the first one.
- Drop it.
- Expected: the question order changes immediately.
- Refresh the page.
- Expected: the new order is preserved.

## Negative Cases

- Drag a question but release it outside the list.
- Expected: no saved order change is applied.

## Regression Check

- Edit a question after reordering.
- Expected: the edit form still saves normally.
- Hide, activate, and delete questions.
- Expected: existing actions still work.
