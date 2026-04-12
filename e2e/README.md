# Playwright E2E

## Installed
- `@playwright/test`
- Chromium browser via `npx playwright install chromium`

## Commands
- `npm run e2e`
- `npm run e2e:ui`
- `npm run e2e:headed`

## Default behavior
- Playwright starts the Angular app locally on `http://127.0.0.1:4300`
- Tests run against `e2e/app.e2e.spec.ts`
- Backend API calls are mocked in `e2e/helpers/app.ts` for deterministic UI coverage

## Run against an existing environment
If you already have the frontend running, or want to target a deployed URL:

```powershell
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:4300'
npm run e2e
```

Example for a deployed app:

```powershell
$env:PLAYWRIGHT_BASE_URL='https://your-frontend-url'
npm run e2e
```

When `PLAYWRIGHT_BASE_URL` is set, Playwright will not start its own web server.

## Current coverage
- Public route smoke checks
- Contact form submission
- Resume upload -> analysis flow
- Resume + JD match -> match results flow
- Unified resumes dashboard rendering

## Notes
- These tests are true browser tests for the frontend flow.
- Third-party auth/payment systems are stubbed so the suite stays stable and fast.
