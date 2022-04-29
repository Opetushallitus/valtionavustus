import { Page } from "@playwright/test";

import {
  getChangedBudgetTableCells,
  getExistingBudgetTableCells,
} from "../utils/util";

export class HakijaMuutoshakemusPaatosPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(linkToMuutoshakemusPaatos: string) {
    await this.page.goto(linkToMuutoshakemusPaatos);
  }

  async title() {
    return await this.page.textContent(
      '[data-test-id="muutoshakemus-paatos-title"]'
    );
  }

  async currentBudgetTitle() {
    return await this.page.textContent('[data-test-id="budget-old-title"]');
  }

  async currentBudgetHeader() {
    return await this.page.textContent('[data-test-id="budget-change-title"]');
  }

  async paatoksetPerustelutTitle() {
    return await this.page.textContent(
      '[data-test-id="muutoshakemus-paatos-perustelut-title"]'
    );
  }

  async paatoksenPerustelut() {
    return await this.page.textContent('[data-test-id="paatos-reason"]');
  }

  async paatoksetTekija() {
    return await this.page.textContent(
      '[data-test-id="muutoshakemus-paatos-tekija-title"]'
    );
  }

  async paatoksenHyvaksyja() {
    return await this.page.textContent('[data-test-id="paatos-decider"]');
  }
  async paatoksenEsittelija() {
    return this.page.innerText('[data-test-id="paatos-esittelija"]');
  }

  async lisatietojaTitle() {
    return await this.page.textContent(
      '[data-test-id="muutoshakemus-paatos-lisatietoja-title"]'
    );
  }

  async lisatietoja() {
    return this.page.innerText('[data-test-id="paatos-esittelija"]');
  }

  async clickLinkToMuutoshakemus() {
    await Promise.all([
      this.page.waitForNavigation(),
      this.page.click('[data-test-id="link-to-muutoshakemus"]'),
    ]);
  }

  async infoSection() {
    return await this.page.textContent('[data-test-id="budget-change"]');
  }

  async existingBudgetTableCells() {
    return await getExistingBudgetTableCells(this.page);
  }

  async changedBudgetTableCells() {
    return await getChangedBudgetTableCells(this.page);
  }

  async jatkoaikaPaatos() {
    return await this.page.textContent('[data-test-id="paatos-jatkoaika"]');
  }

  async sisaltoPaatos() {
    return await this.page.textContent('[data-test-id="paatos-sisaltomuutos"]');
  }

  async talousarvioPaatos() {
    return await this.page.textContent('[data-test-id="paatos-talousarvio"]');
  }
}
