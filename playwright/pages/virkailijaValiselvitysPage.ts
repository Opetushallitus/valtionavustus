import {Page} from "@playwright/test"

import {navigate} from "../utils/navigate"

export function VirkailijaValiselvitysPage(page: Page) {
  async function navigateToValiselvitysTab(avustushakuID: number, hakemusID: number) {
    await navigate(page, `/avustushaku/${avustushakuID}/hakemus/${hakemusID}/valiselvitys/`)
    await page.waitForSelector('[data-test-id="hakemus-details-valiselvitys"]', { state: "visible" })
  }

  async function acceptVäliselvitys() {
    await page.click("text=Lähetä viesti")
    await page.waitForSelector("text=Lähetetty väliselvityksen hyväksyntä")
  }



  return {
    acceptVäliselvitys,
    navigateToValiselvitysTab,
    linkToHakemus: page.locator('text="Linkki lomakkeelle"')
  }
}
