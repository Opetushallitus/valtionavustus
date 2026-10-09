import { expect, Page } from '@playwright/test'

import { navigate } from '../../utils/navigate'

export default function SearchPage(page: Page) {
  const locators = {
    searchInput: page.getByRole('textbox', {
      name: 'Hakusanan pituus tulee olla yli kolme merkkiä',
    }),
    termChips: page.locator('[data-test-class="search-term-chip"]'),
    suggestions: page.locator('[data-test-id="search-suggestions"]'),
  }
  async function navigateToSearchPage() {
    await navigate(page, '/haku/')
    await expect(locators.searchInput).toBeVisible()
  }

  async function search(input: string) {
    await locators.searchInput.fill(input)
    const response = page.waitForResponse((r) => r.url().includes('/api/v2/search/?') && r.ok())
    await locators.searchInput.press('Enter')
    await response
    await page.waitForURL((url: URL) => url.searchParams.get('search') === input)
    await expect(locators.termChips.first()).toBeVisible()
  }

  async function setOrder(order: 'asc' | 'desc') {
    const response = page.waitForResponse((r) => r.url().includes('/api/v2/search/?') && r.ok())
    await page.selectOption('select[name="order"]', `created-at-${order}`)
    await response
  }

  return {
    ...locators,
    search,
    setOrder,
    navigateToSearchPage,
    avustushakuResults: page.locator('[data-test-class="avustushaku-result"]'),
    hakemusResults: page.locator('[data-test-class="hakemus-result"]'),
  }
}
