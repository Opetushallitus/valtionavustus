import { expect, Locator, Page } from "@playwright/test";

import { getExistingBudgetTableCells } from "../utils/util";
import { getLinkToMuutoshakemusFromSentEmails } from "../utils/emails";
import { MuutoshakemusValues } from "../utils/types";
import { BudgetAmount } from "../utils/budget";

export class HakijaMuutoshakemusPage {
  readonly page: Page;
  readonly existingMuutoshakemusLocator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.existingMuutoshakemusLocator = this.page.locator(
      '[data-test-class="existing-muutoshakemus"]'
    );
  }

  async navigate(hakemusID: number) {
    const linkToMuutoshakemus = await getLinkToMuutoshakemusFromSentEmails(
      hakemusID
    );
    await this.navigateWithLink(linkToMuutoshakemus);
  }

  async navigateWithLink(linkToMuutoshakemus: string) {
    await this.page.goto(linkToMuutoshakemus);
    await this.page.locator("h1[id=topic]").waitFor();
  }

  async fillJatkoaikaValues(muutoshakemus: MuutoshakemusValues) {
    if (!muutoshakemus.jatkoaika) throw new Error("Jatkoaika is required");

    await this.clickHaenKayttoajanPidennysta();
    await this.page.fill(
      "#perustelut-kayttoajanPidennysPerustelut",
      muutoshakemus.jatkoaikaPerustelu
    );
    await this.page.fill(
      "div.datepicker input",
      muutoshakemus.jatkoaika.format("DD.MM.YYYY")
    );
  }

  async clickHaenSisaltomuutosta() {
    await this.page.click("#checkbox-haenSisaltomuutosta");
  }

  async clickHaenKayttoajanPidennysta() {
    await this.page.click("#checkbox-haenKayttoajanPidennysta");
  }

  async fillSisaltomuutosPerustelut(perustelut: string) {
    await this.page.fill("#perustelut-sisaltomuutosPerustelut", perustelut);
  }

  async clickHaenMuutostaTaloudenKayttosuunnitelmaan() {
    await this.page.click("#checkbox-haenMuutostaTaloudenKayttosuunnitelmaan");
  }

  async fillTalousarvioValues(
    budget: Partial<BudgetAmount>,
    explanation?: string
  ) {
    const keyValuePair = Object.entries(budget);
    for (const [key, value] of keyValuePair) {
      await this.page.fill(
        `input[name='talousarvio.${key}-costs-row'][type='number']`,
        value ?? "0"
      );
    }
    if (explanation) {
      await this.page.fill(
        "#perustelut-taloudenKayttosuunnitelmanPerustelut",
        explanation
      );
    }
  }

  async clickSendMuutoshakemus() {
    await this.page.click(
      '#send-muutospyynto-button:has-text("Lähetä käsiteltäväksi")'
    );
  }

  async clickSaveContacts() {
    await this.page.click('text="Tallenna muutokset"');
  }

  async expectMuutoshakemusToBeSubmittedSuccessfully(isApplication: boolean) {
    const notification = await this.page.textContent(
      'div[class="auto-hide success"]'
    );

    // The text is different if we are actually applying for jatkoaika/budjettimuutos/sisältömuutos
    const notificationText = isApplication
      ? "Muutoshakemus lähetetty"
      : "Muutokset tallennettu";
    expect(notification).toBe(notificationText);
  }

  async getMuutoshakemusSisaltomuutosPerustelut() {
    return this.page.innerText(
      '[data-test-class="existing-muutoshakemus"] [data-test-id="sisaltomuutos-perustelut"]'
    );
  }

  expectApprovedBudgetToBe(
    page: Page,
    budget: BudgetAmount
  ): () => Promise<void> {
    return async function verifyBudget() {
      const budgetExpectedItems = [
        { description: "Henkilöstömenot", amount: `${budget.personnel} €` },
        {
          description: "Aineet, tarvikkeet ja tavarat",
          amount: `${budget.material} €`,
        },
        { description: "Laitehankinnat", amount: `${budget.equipment} €` },
        { description: "Palvelut", amount: `${budget["service-purchase"]} €` },
        { description: "Vuokrat", amount: `${budget.rent} €` },
        { description: "Matkamenot", amount: `${budget.steamship} €` },
        { description: "Muut menot", amount: `${budget.other} €` },
      ];

      const budgetRows = await getExistingBudgetTableCells(page);
      expect(budgetRows).toEqual(budgetExpectedItems);
    };
  }

  async sendMuutoshakemus(isApplication: boolean, swedish?: boolean) {
    if (swedish) {
      await this.locators().sendMuutospyyntoButton.click();
      expect(
        await this.page.textContent('div[class="auto-hide success"]')
      ).toEqual("Ändringsansökan har skickats");
    } else {
      await this.clickSendMuutoshakemus();
      await this.expectMuutoshakemusToBeSubmittedSuccessfully(isApplication);
    }
  }

  async changeContactPersonEmailTo(email: string) {
    await this.page.fill("#muutoshakemus__email", email);
  }

  locators() {
    const originalHakemusIframe = this.page.frameLocator(
      'iframe[data-test-id="original-hakemus"]'
    );
    return {
      avustushakuName: this.page.locator("[data-test-id=avustushaku-name]"),
      projectName: this.page.locator("[data-test-id=project-name]"),
      registerNumber: this.page.locator(
        '[data-test-id="register-number-title"]'
      ),
      contactPerson: this.page.locator("#muutoshakemus__contact-person"),
      contactPersonLabel: this.page.locator(
        'label[for="muutoshakemus__contact-person"]'
      ),
      contactPersonEmail: this.page.locator("#muutoshakemus__email"),
      contactPersonEmailLabel: this.page.locator(
        'label[for="muutoshakemus__email"]'
      ),
      contactPersonPhoneNumber: this.page.locator("#muutoshakemus__phone"),
      contactPersonPhoneNumberLabel: this.page.locator(
        'label[for="muutoshakemus__phone"]'
      ),
      sendMuutospyyntoButton: this.page.locator("#send-muutospyynto-button"),
      originalHakemus: {
        contactPersonName: originalHakemusIframe.locator("#applicant-name"),
        yTunnus: originalHakemusIframe.locator("#business-id div"),
      },
      haenKayttoajanPidennystaLabel: this.page.locator(
        'label[for="checkbox-haenKayttoajanPidennysta"]'
      ),
      haenMuutostaTaloudenKayttosuunnitelmaanLabel: this.page.locator(
        'label[for="checkbox-haenMuutostaTaloudenKayttosuunnitelmaan"]'
      ),
      existingJatkoaikaTitle: this.page.locator(
        '[data-test-id="jatkoaika-title-existing"]'
      ),
      newJatkoaikaTitle: this.page.locator(
        '[data-test-id="jatkoaika-title-new"]'
      ),
      kayttoajanPidennysPerusteluLabel: this.page.locator(
        'label[for="perustelut-kayttoajanPidennysPerustelut"]'
      ),
      perustelutError: this.page.locator(
        ".muutoshakemus__perustelut .muutoshakemus__error-message"
      ),
      calendar: {
        input: this.page.locator("[name=haettuKayttoajanPaattymispaiva]"),
        button: this.page.locator('button[title="Select date"]'),
        monthLabel: this.page.locator('button[id="rw_4_calendar_label"]'),
      },
      budget: {
        expensesTotalTitle: this.page.locator(
          '[data-test-id="expenses-total-title"]'
        ),
        taloudenKayttosuunnitelmanPerustelutLabel: this.page.locator(
          'label[for="perustelut-taloudenKayttosuunnitelmanPerustelut"]'
        ),
        budgetRows: this.page
          .locator("[data-test-id=meno-input-row]")
          .locator(".description"),
        perustelut: this.page.locator('[data-test-id="budget-old-title"]'),
        changeTitle: this.page.locator('[data-test-id="budget-change-title"]'),
      },
    };
  }
}
