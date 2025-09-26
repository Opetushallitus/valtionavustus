import { expect, Page } from '@playwright/test'

import { navigate } from '../../utils/navigate'

export default function SearchPage(page: Page) {
  const locators = {
    searchInput: page.getByRole('textbox', {
      name: 'Hakusanan pituus tulee olla yli kolme merkkiä',
    }),
  }
  async function navigateToSearchPage() {
    await navigate(page, '/haku/')
    await expect(locators.searchInput).toBeVisible()
  }

  async function search(input: string) {
    await locators.searchInput.fill(input)
    await locators.searchInput.press('Enter')
    await page.waitForURL((url: URL) => url.search.includes(`search=${encodeURIComponent(input)}`))
    await expect(page.locator('[data-test-class="results"]').nth(0)).toBeVisible()
  }

  async function setOrder(order: 'asc' | 'desc') {
    await page.selectOption('select[name="order"]', `created-at-${order}`)
  }

  return {
    search,
    setOrder,
    navigateToSearchPage,
    avustushakuResults: page.locator('[data-test-class="avustushaku-result"]'),
    hakemusResults: page.locator('[data-test-class="hakemus-result"]'),
  }
}
