import { test as base, BrowserContext, Browser } from '@playwright/test'

/**
 * Autosave timeout for tests (in milliseconds).
 * This is much shorter than the production value (3000ms) to speed up tests.
 */
export const TEST_AUTOSAVE_TIMEOUT = 500

const AUTOSAVE_INIT_SCRIPT = `window.__VA_AUTOSAVE_TIMEOUT__ = ${TEST_AUTOSAVE_TIMEOUT};`

/**
 * Adds the autosave timeout init script to a browser context.
 * Call this for any context created via browser.newContext().
 */
export async function configureAutosaveTimeout(context: BrowserContext): Promise<void> {
  await context.addInitScript(AUTOSAVE_INIT_SCRIPT)
}

/**
 * Wraps a browser to automatically configure autosave timeout for all new contexts.
 */
function wrapBrowser(browser: Browser): Browser {
  const originalNewContext = browser.newContext.bind(browser)
  browser.newContext = async (options) => {
    const context = await originalNewContext(options)
    await configureAutosaveTimeout(context)
    return context
  }
  return browser
}

/**
 * Base test fixture that configures browser contexts for faster autosave.
 * All test fixtures should extend from this to get the optimized autosave timeout.
 */
export const test = base.extend({
  browser: async ({ browser }, use) => {
    await use(wrapBrowser(browser))
  },
})

export { expect } from '@playwright/test'
