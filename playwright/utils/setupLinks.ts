/**
 * Helpers for the `task setup:*` manual-test seeders.
 *
 * The seeders reuse the real Playwright tests: when `SETUP_LINKS=<scenario>` is set,
 * the matching test reaches the desired state, prints the links a developer needs to
 * continue manually, and returns early — before running the rest of its assertions.
 * When `SETUP_LINKS` is unset (CI, normal runs) these helpers are inert, so the tests
 * behave exactly as before.
 *
 * The only setup-specific logic that lives in a test is a single guarded line; the state
 * itself is produced by the test's existing fixtures and steps (the single source of truth).
 *
 * See scripts/setup-manual-test.sh and the `setup:*` tasks in Taskfile.yml.
 */

import * as fs from 'node:fs'

/** True when this run is seeding the given scenario. */
export function isSetupScenario(scenario: string): boolean {
  return process.env.SETUP_LINKS === scenario
}

/** Print a clearly delimited block of links to stdout. */
export function printSetupLinks(scenario: string, links: Record<string, string>): void {
  const border = '═'.repeat(70)
  const labelWidth = Math.max(...Object.keys(links).map((label) => label.length))
  const lines = Object.entries(links).map(([label, url]) => `  ${label.padEnd(labelWidth)}  ${url}`)
  const block = ['', border, `  SETUP READY: ${scenario}`, border, ...lines, border, ''].join('\n')
  // Playwright runs with `quiet: true` by default (see playwright.config.ts), which
  // suppresses test stdout. So besides logging, write the block to a file the wrapper
  // script (scripts/setup-manual-test.sh) prints after the run — always visible.
  console.log(block)
  const outputFile = process.env.SETUP_LINKS_OUTPUT
  if (outputFile) {
    fs.appendFileSync(outputFile, block + '\n')
  }
}

/**
 * One-liner breakpoint for scenarios whose links are known synchronously:
 *   if (setupBreakpoint('muutoshakemus', { ... })) return
 *
 * For scenarios whose links must be awaited (e.g. extracted from emails), use
 * `isSetupScenario()` + `printSetupLinks()` directly so the link can be awaited first.
 */
export function setupBreakpoint(scenario: string, links: Record<string, string>): boolean {
  if (!isSetupScenario(scenario)) return false
  printSetupLinks(scenario, links)
  return true
}
