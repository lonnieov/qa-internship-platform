# Intern Profile Search Verification

## Preconditions

- Run the app locally.
- Sign in as admin.
- Have at least two intern profiles with different names.

## Smoke Check

- Open `/admin/interns`.
- Expected: `Профили стажёров` contains a `Поиск по ФИО` field and `Найти` button.

## Positive Case

- Enter a known intern name, for example `Иван`.
- Click `Найти`.
- Expected: URL contains `q=Иван`.
- Expected: only matching intern profiles are shown.
- Click `Сбросить`.
- Expected: full profile list is shown again.

## Negative Cases

- Enter `zzzz-no-match`.
- Click `Найти`.
- Expected: empty state `Стажёры не найдены` is shown.

## Regression Check

- Create a new intern token from `Выдать доступ стажёру`.
- Expected: token creation still works.
- Check `Последние токены`.
- Expected: token list is not filtered by intern profile search.
