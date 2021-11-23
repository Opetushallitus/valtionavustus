import {Page} from "playwright";
import {
  getChangedBudgetTableCells,
  getExistingBudgetTableCells, textContent,
} from "../utils/util";

export class HakijaMuutoshakemusPaatosPage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(linkToMuutoshakemusPaatos: string) {
    await this.page.goto(linkToMuutoshakemusPaatos)
  }

  async title() {
    return await textContent(this.page,'[data-test-id="muutoshakemus-paatos-title"]')
  }

  async currentBudgetTitle() {
    return await textContent(this.page,'[data-test-id="budget-old-title"]')
  }

  async currentBudgetHeader() {
    return await textContent(this.page,'[data-test-id="budget-change-title"]')
  }

  async paatoksetPerustelutTitle() {
    return await textContent(this.page,'[data-test-id="muutoshakemus-paatos-perustelut-title"]')
  }

  async paatoksenPerustelut() {
    return await textContent(this.page,'[data-test-id="paatos-reason"]')
  }

  async paatoksetTekija() {
    return await textContent(this.page,'[data-test-id="muutoshakemus-paatos-tekija-title"]')
  }

  async paatoksenHyvaksyja() {
    return this.page.textContent( '[data-test-id="paatos-decider"]')
  }
  async paatoksenEsittelija() {
    return this.page.innerText('[data-test-id="paatos-esittelija"]')
  }

  async lisatietojaTitle() {
    return await textContent(this.page,'[data-test-id="muutoshakemus-paatos-lisatietoja-title"]')
  }

  async lisatietoja() {
    return this.page.innerText('[data-test-id="paatos-esittelija"]')
  }

  async clickLinkToMuutoshakemus() {
    await Promise.all([
      this.page.waitForNavigation(),
      this.page.click('[data-test-id="link-to-muutoshakemus"]')
    ])
  }

  async infoSection() {
    return await textContent(this.page,'[data-test-id="budget-change"]')
  }

  async existingBudgetTableCells() {
    return await getExistingBudgetTableCells(this.page)
  }

  async changedBudgetTableCells() {
    return await getChangedBudgetTableCells(this.page)
  }

  async jatkoaikaPaatos() {
    return await textContent(this.page,'[data-test-id="paatos-jatkoaika"]')
  }

  async sisaltoPaatos() {
    return await textContent(this.page,'[data-test-id="paatos-sisaltomuutos"]')
  }

  async talousarvioPaatos() {
    return await textContent(this.page,'[data-test-id="paatos-talousarvio"]')
  }
}
