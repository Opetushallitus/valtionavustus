# Playwright tests

Read `TESTING_PATTERNS.md` before writing or modifying any test. In addition to it:

- **Await API responses triggered by actions.** When a click triggers an API call that updates the DOM, wrap the click and `page.waitForResponse()` in `Promise.all`.
- **Wait for cascading responses.** If the primary response makes the frontend fetch again, wait for both before asserting on the DOM.
