# AGENTS

## Feature Docs Rule

When a feature is implemented and considered complete, create or update a docs
folder for that feature.

Required structure:

```text
docs/features/<feature-slug>/
  README.md
  VERIFY.md
```

## What `README.md` Must Contain

Keep it compact and optimized for search and low-token analysis.

Required sections:

1. `Purpose`
2. `Scope`
3. `Data Model` if storage/schema changed
4. `Main Flow`
5. `Touched Files`
6. `Constraints`

Rules:

- prefer short paragraphs and flat lists
- prefer file paths like `src/actions/intern.ts`
- do not use absolute machine-specific paths
- do not paste large code blocks unless necessary
- describe the current behavior only

## What `VERIFY.md` Must Contain

Required sections:

1. `Preconditions`
2. `Smoke Check`
3. `Positive Case`
4. `Negative Cases` if relevant
5. `Regression Check`

Rules:

- write only manual verification steps
- keep steps executable by a human tester
- include exact sample inputs when useful
- include expected result for each important scenario

## When To Write Feature Docs

Write or update feature docs when at least one of these is true:

- a new user-facing feature was added
- a new admin workflow was added
- a new API or question type was added
- schema or stored payload shape changed
- manual QA needs exact repro instructions

## Naming

Use a short stable folder name:

- `api-sandbox`
- `token-login`
- `attempt-report`

Avoid dates and task IDs in folder names.

## Minimal Template

`README.md`

```md
# <Feature Name>

## Purpose

## Scope

## Data Model

## Main Flow

## Touched Files

## Constraints
```

`VERIFY.md`

```md
# <Feature Name> Verification

## Preconditions

## Smoke Check

## Positive Case

## Negative Cases

## Regression Check
```
