import {Page} from "@playwright/test"

import {navigate} from "../utils/navigate"

export class ValiselvitysPage {
  private page: Page

  constructor(page: Page) {
    this.page = page
  }

  async navigateToValiselvitysTab(avustushakuID: number, hakemusID: number) {
    await navigate(this.page, `/avustushaku/${avustushakuID}/hakemus/${hakemusID}/valiselvitys/`)
    await this.page.waitForSelector('[data-test-id="hakemus-details-valiselvitys"]', { state: "visible" })
  }

  async acceptVäliselvitys() {
    await this.page.click("text=Lähetä viesti")
    await this.page.waitForSelector("text=Lähetetty väliselvityksen hyväksyntä")
  }
}
