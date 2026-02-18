# Playwright Tests

## Required Reading

Before writing or modifying any Playwright test, read `TESTING_PATTERNS.md` in this directory. It documents mandatory patterns for avoiding race conditions exposed by fast-saving form inputs.

## Key Rules

1. **Wait for cascading API responses** — If an action triggers a primary API call whose response causes the frontend to make a secondary fetch, wait for BOTH responses before asserting on the DOM. Use `Promise.all` with multiple `page.waitForResponse()` calls.

2. **Poll for emails** — Never do a single fetch + assert on email count. Use `waitUntilMinEmails()` or `expect.poll()`.

3. **Stabilize UI before interaction** — Call `waitForSave()` before filling inputs or clicking interactive elements when saves may be in flight.

4. **Wait for API responses after actions** — When a click triggers an async API call that updates the DOM, use `Promise.all` with `page.waitForResponse()` and the click.

## Anti-Patterns (Do NOT Do These)

- Direct email fetch + assert without polling
- Asserting on DOM that depends on a secondary API call without waiting for it
- Filling inputs or clicking while saves are in progress
- Using `waitForResponse` for only the primary API when the DOM depends on a cascading secondary fetch
