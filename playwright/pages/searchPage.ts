import { Page } from "@playwright/test";

import { navigate } from "../utils/navigate";

export default function SearchPage(page: Page) {
  async function navigateToSearchPage() {
    await navigate(page, "/haku/");
    await page.waitForSelector('[name="search"]', { state: "visible" });
  }

  async function search(input: string) {
    await page.fill('input[name="search"]', input);
    await page.press('input[name="search"]', "Enter");
    await page.waitForURL((url: URL) =>
      url.search.includes(`search=${encodeURIComponent(input)}`)
    );
    await page.waitForSelector('[data-test-class="results"]');
  }

  async function setOrder(order: "asc" | "desc") {
    await page.selectOption('select[name="order"]', `created-at-${order}`);
  }

  return {
    search,
    setOrder,
    navigateToSearchPage,
    avustushakuResults: page.locator('[data-test-class="avustushaku-result"]'),
    hakemusResults: page.locator('[data-test-class="hakemus-result"]'),
  };
}
