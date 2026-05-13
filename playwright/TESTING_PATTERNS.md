# Playwright Testing Patterns: Avoiding Race Conditions

## Introduction

VA-476 changed non-text form inputs to save with 100ms coalescing instead of 3000ms debounce. This creates more HTTP traffic and more frequent React re-renders, exposing latent race conditions in tests. Tests that relied on timing gaps between API calls now need explicit synchronization.

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
await locators.hakuRole.searchInput.fill(name)
await searchResults.locator('a').getByText(name).click()
```

**Bad:**

```typescript
// BAD: a concurrent save may re-render the component, clearing the search input
await locators.hakuRole.searchInput.fill(name)
await searchResults.locator('a').getByText(name).click()
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

## Ensure data-test-id locators are unique

Playwright runs in strict mode by default — a locator that matches multiple elements throws a "strict mode violation" error. When adding `data-test-id` attributes to components, verify the ID is unique across the rendered page. Reusable components are especially risky: a `data-test-id` on a wrapper component will appear once per instance.

**Example:** A `data-test-id="muutospaatos-asia-content"` existed on both `ProjectSection` (the "Asia" overview) and the `Muutospaatos` wrapper component. When `YhteishankePaatosSection` was added, it rendered a second `Muutospaatos` instance, causing the locator to resolve to 2 elements.

**Good — unique test IDs on reusable components:**

```typescript
// Component uses a dynamic test-id based on a prop
<div data-test-id={`muutospaatos-${osio}-content`}>

// Test targets the specific static instance
await expect(page.locator('[data-test-id="muutospaatos-asia-content"]')).toContainText(...)
```

**Bad — same static test-id on a reusable component:**

```typescript
// Component always renders the same test-id
<div data-test-id="muutospaatos-asia-content">

// Test breaks with strict mode violation when multiple instances exist
await expect(page.locator('[data-test-id="muutospaatos-asia-content"]')).toContainText(...)
```

**Prevention:** When adding `data-test-id` to a component that is rendered multiple times (or could be in the future), parameterize the ID — e.g., include a section name, index, or entity ID.

## Anti-patterns checklist

- Direct email fetch + assert without polling
- Filling inputs or clicking while saves are in progress
- Missing `failOnStatusCode: true` on test API calls (silent errors cause misleading timeouts)
- Re-selecting a value already set by fixtures and assuming it will trigger a save
- Using a static `data-test-id` on a reusable component that renders multiple times on the page
