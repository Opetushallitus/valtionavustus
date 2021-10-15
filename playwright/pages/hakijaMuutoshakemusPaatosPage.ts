import {Page} from "playwright";
import {
  getChangedBudgetTableCells,
  getExistingBudgetTableCells, textContent,
} from "../utils/util";

const budgetRowSelector = '.muutoshakemus-paatos__content [data-test-id=meno-input-row]'

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
    return await textContent(this.page,'.currentBudget')
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

  async lisatietojaTitle() {
    return await textContent(this.page,'[data-test-id="muutoshakemus-paatos-lisatietoja-title"]')
  }

  async infoSection() {
    return await textContent(this.page,'[data-test-id="budget-change"]')
  }

  async existingBudgetTableCells() {
    return await getExistingBudgetTableCells(this.page, budgetRowSelector)
  }

  async changedBudgetTableCells() {
    return await getChangedBudgetTableCells(this.page, budgetRowSelector)
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
