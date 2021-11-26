import {Page} from "@playwright/test"

import {navigate} from "../utils/navigate"

export function LoppuselvitysPage(page: Page) {

  async function navigateToLoppuselvitysTab(avustushakuID: number, hakemusID: number) {
    await navigate(page, `/avustushaku/${avustushakuID}/hakemus/${hakemusID}/loppuselvitys/`)
    await page.waitForSelector('[data-test-id="hakemus-details-loppuselvitys"]', { state: "visible" })
  }

  return {
    navigateToLoppuselvitysTab
  }
}
