# API Sandbox

## Purpose

Add a new question type for internship assessment: `API_SANDBOX`.

This question type checks whether a candidate can build a simple HTTP request
from a task description instead of choosing one option from a quiz.

## Scope

Included in this iteration:

- admin can create `API_SANDBOX` questions
- intern sees a small request builder UI
- request is evaluated by an internal simulator, not by an external API
- last request/response is stored in attempt answers
- admin report shows API request activity

Not included:

- real external HTTP calls
- Postman collections
- auth presets
- chained requests
- multipart/form-data
- scripting/assertions

## Data Model

Files:

- `prisma/schema.prisma`

Main additions:

- `Question.type`: `QUIZ | API_SANDBOX`
- `Question.apiConfig`: expected request and success response
- `AssessmentAnswer.apiRequest`: normalized last request
- `AssessmentAnswer.apiResponse`: simulated last response
- `AssessmentAnswer.submissionCount`: number of API sends
- `TrackingEventType.API_REQUEST`

## Request Evaluation

File:

- `src/lib/api-sandbox.ts`

Current evaluator checks:

- HTTP method
- path
- query params
- required headers
- JSON body

Current simulated failure modes:

- `400` invalid request format
- `400` wrong query
- `400` wrong body
- `401` missing/wrong authorization header
- `404` wrong path
- `405` wrong method

## Main Flow

Admin flow:

1. Open `/admin/questions`
2. Select question type `API_SANDBOX`
3. Enter task text and expected request config
4. Save question

Intern flow:

1. Open test
2. Navigate to `API_SANDBOX` question
3. Fill `Method`, `URL`, `Headers`, `JSON Body`
4. Press `Send`
5. Read simulated response
6. Fix request until response is correct

## Touched UI

Admin:

- `components/admin/question-form.tsx`
- `app/admin/questions/page.tsx`

Intern:

- `app/intern/test/page.tsx`
- `components/intern/test-runner.tsx`

Server actions:

- `src/actions/admin.ts`
- `src/actions/intern.ts`

Report:

- `app/admin/attempts/[attemptId]/page.tsx`

## Seed Data

File:

- `prisma/seed.ts`

Seed adds one sample `API_SANDBOX` question about creating a user with:

- `POST /users`
- `Authorization: Bearer test-token`
- `Content-Type: application/json`
- body `{ "name": "Ali Valiyev" }`

## Constraints

- evaluator is strict: exact match for method/path/query/headers/body
- request state is persisted as the last sent request, not full history
- full candidate activity history is still available via tracking events
