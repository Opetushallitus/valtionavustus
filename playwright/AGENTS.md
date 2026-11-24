# Playwright tests

Read `TESTING_PATTERNS.md` before writing or modifying any test. In addition to it:

- **Await API responses triggered by actions.** When a click triggers an API call that updates the DOM, wrap the click and `page.waitForResponse()` in `Promise.all`.
- **Wait for cascading responses.** If the primary response makes the frontend fetch again, wait for both before asserting on the DOM.
- **Extend a test with `test.step` instead of adding a new test.** Fixture setup (creating an avustushaku, a hakemus, selvityspyynnöt) is the slowest part of a test. When a new check can run on the same hakemus as an existing test, add it as a step there instead of adding a test that builds the setup again. Order the steps so that each one starts from the state its check needs. Add a separate test only when the check needs a fresh state that an earlier step would change.
