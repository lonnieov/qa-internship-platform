# API Sandbox Verification

## Preconditions

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Use:

- admin login: `admin`
- admin password: `admin`

## Smoke Check

1. Open `/admin/questions`
2. Confirm at least one `API Sandbox` question exists
3. Open `/sign-in/intern` with a valid issued token
4. Start a test
5. Confirm an API question shows fields for `Method`, `URL`, `Headers`, `JSON Body`
6. Press `Send` and confirm a response panel appears

## Positive Case

For the seeded question, send:

- method: `POST`
- url: `/users`
- headers:

```text
Authorization: Bearer test-token
Content-Type: application/json
```

- body:

```json
{
  "name": "Ali Valiyev"
}
```

Expected:

- response status is `201`
- response body is successful
- question becomes accepted/completed in UI
- submission counter increases

## Negative Cases

### Wrong path

- url: `/wrong-path`
- expected: `404`

### Wrong method

- method: `GET`
- expected: `405`

### Missing auth

- omit `Authorization`
- expected: `401`

### Wrong body

```json
{
  "name": "Wrong Name"
}
```

- expected: `400`

### Invalid header format

```text
Authorization Bearer test-token
```

- expected: `400`

## Report Check

1. Finish the test
2. Open the latest attempt from admin pages
3. Confirm the API question row shows:

- submission count
- last request payload
- response status/result

## Regression Check

Confirm existing quiz behavior still works:

- quiz questions can still be answered
- final score is still calculated
- result screen still opens
- token is still invalidated after completion
