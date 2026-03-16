# Playwright Testing Patterns: Avoiding Race Conditions

## Introduction

VA-476 changed non-text form inputs to save with 100ms coalescing instead of 3000ms debounce. This creates more HTTP traffic and more frequent React re-renders, exposing latent race conditions in tests. Tests that relied on timing gaps between API calls now need explicit synchronization.

## Wait for cascading API responses

When the frontend triggers a secondary fetch after processing a primary API response, the test must wait for BOTH. Example: sending päätös triggers a POST to `/api/paatos/sendall/{id}`, then the frontend fetches tapahtumaloki data from `/api/avustushaku/{id}/tapahtumaloki/paatoksen_lahetys`. The test must wait for both before asserting on the DOM.

**Good pattern:**

```typescript
await Promise.all([
  page.waitForResponse(new RegExp('/api/paatos/sendall/\\d+$')),
  page.waitForResponse(
    new RegExp('/api/avustushaku/\\d+/tapahtumaloki/paatoksen_lahetys$')
  ),
  locators.confirmSending.click(),
])
await expect(page.locator('.tapahtumaloki .entry')).toHaveCount(1)
```

**Bad pattern:**

```typescript
await Promise.all([
  page.waitForResponse(new RegExp('/api/paatos/sendall/\\d+$')),
  locators.confirmSending.click(),
])
// BAD: tapahtumaloki data comes from a separate fetch that may not have completed yet
await expect(page.locator('.tapahtumaloki .entry')).toHaveCount(1)
```

## Email assertions with retry

Never do a single fetch + assert on email count. Use `waitUntilMinEmails()` for hakemus-scoped emails or `expect.poll()` for avustushaku-scoped emails.

**Good (hakemus-scoped):**

```typescript
const emails = await waitUntilMinEmails(
  getLoppuselvitysTaydennysReceivedEmails,
  1,
  hakemusID
)
expect(emails).toHaveLength(1)
```

**Good (avustushaku-scoped):**

```typescript
let emails: Email[] = []
await expect
  .poll(async () => {
    emails = await getSelvitysEmailsWithLoppuselvitysSubject(avustushakuID)
    return emails.length
  })
  .toEqual(1)
```

**Bad:**

```typescript
// BAD: email may not be persisted yet
const emails = await getEmails(hakemusID)
expect(emails).toHaveLength(1)
```

## Stabilize UI before interaction

Wait for saves to complete before filling inputs or clicking interactive elements. Concurrent saves can cause re-renders that reset component state (e.g., clearing a search input during its debounce window).

**Good:**

```typescript
await common.waitForSave()
await Promise.all([
  page.waitForResponse('/api/va-user/search'),
  locators.hakuRole.searchInput.fill(name),
])
await searchResults.locator('a').getByText(name).click()
```

**Bad:**

```typescript
// BAD: a concurrent save may re-render the component, clearing the search input
await locators.hakuRole.searchInput.fill(name)
await searchResults.locator('a').getByText(name).click()
```

## Wait for API response after triggering actions

When a button click triggers an async API call that updates the DOM, use `Promise.all` to wait for the response.

**Good:**

```typescript
await Promise.all([
  page.waitForResponse(new RegExp('/api/v2/grants/\\d+/payments/')),
  maksatuksetPage.luoMaksatukset.click(),
])
await expect(firstRowHanke).toHaveText(projectName)
```

**Bad:**

```typescript
// BAD: relies entirely on Playwright auto-retry timeout
await maksatuksetPage.luoMaksatukset.click()
await expect(firstRowHanke).toHaveText(projectName)
```

## Make fixture-driven setup idempotent

Shared fixtures often pre-populate the haku before the test body runs. Helpers that "fill" the same field again must check whether the desired value is already selected before trying to select it again.

This matters especially for React Select fields such as TA-tili and koulutusaste: once the current value is already selected, the matching dropdown option may be rendered as disabled. A second `ArrowDown`/`Enter` or option click can then do nothing, and a following `waitForSave()` will hang because no save was triggered.

**Good:**

```typescript
if (!(await firstTaTili.value.filter({ hasText: talousarviotili.code }).isVisible())) {
  await firstTaTili.input.fill(talousarviotili.code)
  await expect(firstTaTili.option.filter({ hasText: talousarviotili.code }).first()).toBeEnabled()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await common.waitForSave()
}
```

**Bad:**

```typescript
// BAD: fails when fixture already selected the same value and the option is disabled
await firstTaTili.input.fill(talousarviotili.code)
await page.keyboard.press('ArrowDown')
await page.keyboard.press('Enter')
await common.waitForSave()
```

## Localized UI text in shared fixtures

Shared fixtures (e.g., `budjettimuutoshakemusTest`) are extended by Swedish test variants via `swedishHakemusTest.ts`. Any code that waits for or asserts on UI text must handle both languages. Save status messages are "Tallennettu" (Finnish) and "Sparat" (Swedish). Translations are in `server/resources/public/translations.json`.

**Good:**

```typescript
await page.waitForFunction(() => {
  const text = document.querySelector('div.save-message')?.textContent
  return text?.includes('Tallennettu') || text?.includes('Sparat')
})
```

**Bad:**

```typescript
// BAD: breaks Swedish tests that extend this fixture
await page.waitForFunction(() =>
  document.querySelector('div.save-message')?.textContent?.includes('Tallennettu')
)
```

## Anti-patterns checklist

- Direct email fetch + assert without polling
- Asserting on DOM that depends on a secondary API call without waiting for it
- Filling inputs or clicking while saves are in progress
- Missing `failOnStatusCode: true` on test API calls (silent errors cause misleading timeouts)
- Using `waitForResponse` for only the primary API when the DOM depends on a cascading secondary fetch
- Re-selecting a value already set by fixtures and assuming it will trigger a save
