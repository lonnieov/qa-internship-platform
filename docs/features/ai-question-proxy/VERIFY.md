# AI Question Proxy Verification

## Preconditions

- App is running.
- Admin user is signed in.
- `CLI_PROXY_API_URL`, `CLI_PROXY_API_KEY`, and `CLI_PROXY_MODEL` are set.
- CLIProxyAPI sidecar is running and authorized.

## Smoke Check

1. Open admin question bank.
2. Open the AI question generator.
3. Enter topic `smoke testing`.
4. Click generate.
5. Expected: three generated quiz suggestions appear.

## Positive Case

1. Start CLIProxyAPI with `docker compose --profile ai up -d cli-proxy-api`.
2. Ensure the app points to the sidecar URL.
3. Generate questions as admin.
4. Expected: `/api/ai/questions` returns JSON with `questions`.

## Negative Cases

1. Unset `CLI_PROXY_API_KEY`.
2. Try generating questions.
3. Expected: UI shows that AI proxy is not configured.

## Regression Check

1. Search the app for old direct provider environment variables and routes.
2. Expected: no client calls use the old provider-specific route.
