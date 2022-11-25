import { expect, Locator, Page } from "@playwright/test";

import { navigate } from "../utils/navigate";
import {
  clickElementWithText,
  expectToBeDefined,
  getChangedBudgetTableCells,
  getExistingBudgetTableCells,
} from "../utils/util";
import { VIRKAILIJA_URL } from "../utils/constants";

import {
  MuutoshakemusValues,
  PaatosStatus,
  PaatosValues,
  VaCodeValues,
} from "../utils/types";
import { AcceptedBudget, BudgetAmount, fillBudget } from "../utils/budget";
import { HakijaAvustusHakuPage } from "./hakijaAvustusHakuPage";
import { createReactSelectLocators } from "../utils/react-select";

const jatkoaikaTestId = "muutoshakemus-jatkoaika";

export class HakemustenArviointiPage {
  readonly page: Page;
  readonly avustushakuDropdown: Locator;
  readonly inputFilterOrganization: Locator;
  readonly inputFilterProject: Locator;
  readonly hakemusListing: Locator;
  readonly showUnfinished: Locator;
  readonly hakemusRows: Locator;
  readonly toggleHakemusList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.avustushakuDropdown = this.page.locator("#avustushaku-dropdown");
    this.inputFilterOrganization =
      this.page.getByPlaceholder("Hakijaorganisaatio");
    this.inputFilterProject = this.page.getByPlaceholder(
      "Asiatunnus tai hanke"
    );
    this.hakemusListing = this.page.locator("#hakemus-listing");
    this.showUnfinished = this.page.locator('text="Näytä keskeneräiset"');
    this.hakemusRows = this.hakemusListing.locator("tbody tr");
    this.toggleHakemusList = this.page.locator("#toggle-hakemus-list-button");
  }

  async navigate(
    avustushakuID: number,
    options?: {
      showAll?: boolean;
      showAdditionalInfo?: boolean;
    }
  ) {
    const params = new URLSearchParams();
    if (options?.showAll) {
      params.append("showAll", "true");
    }
    if (options?.showAdditionalInfo) {
      params.append("showAdditionalInfo", "true");
    }
    await navigate(
      this.page,
      `/avustushaku/${avustushakuID}/?${params.toString()}`
    );
  }

  async navigateToLatestHakemusArviointi(
    avustushakuID: number,
    isDraft: boolean = false
  ): Promise<number> {
    await navigate(this.page, `/avustushaku/${avustushakuID}/`);
    if (isDraft) {
      await this.showUnfinished.check();
    }
    await this.page.click("tbody tr:first-of-type");
    await this.page.waitForSelector("#hakemus-details");
    return await this.page
      .evaluate(() => window.location.pathname.match(/\/hakemus\/(\d+)\//)?.[1])
      .then((possibleHakemusID) => {
        expectToBeDefined(possibleHakemusID);
        return parseInt(possibleHakemusID);
      });
  }

  async navigateToLatestMuutoshakemus(
    avustushakuID: number,
    hakemusID: number
  ) {
    await navigate(
      this.page,
      `/avustushaku/${avustushakuID}/hakemus/${hakemusID}/muutoshakemukset/`
    );
    await this.page.waitForSelector("#tab-content");
    await this.page.waitForLoadState("networkidle");
  }

  async navigateToHakemusArviointi(avustushakuID: number, hakemusID: number) {
    await navigate(
      this.page,
      `/avustushaku/${avustushakuID}/hakemus/${hakemusID}/arviointi/`
    );
  }

  async navigateToHakemus(
    avustushakuId: number,
    hanke: string,
    options?: { showAll?: boolean }
  ) {
    await this.navigate(avustushakuId, options);
    await this.page.click(`span:text-matches("${hanke}")`);
    await this.page.waitForSelector(
      `#project-name div:text-matches("${hanke}")`
    );
  }

  async waitForSave() {
    await this.page.waitForSelector(
      '[data-test-id="save-status"]:has-text("Kaikki tiedot tallennettu")'
    );
  }

  async clickHakemus(hakemusID: number) {
    await Promise.all([
      this.page.waitForNavigation(),
      this.page.getByTestId(`hakemus-${hakemusID}`).click(),
    ]);
  }

  async clickHakemusByHanke(hanke: string) {
    await Promise.all([
      this.page.waitForNavigation(),
      this.page.click(`span:text-matches("${hanke}")`),
    ]);
  }

  async closeHakemusDetails() {
    await this.page.locator("#close-hakemus-button").click();
  }

  async openUkotusModal(hakemusID: number) {
    await this.page
      .getByTestId(`hakemus-${hakemusID}`)
      .locator(`[aria-label="Lisää valmistelija hakemukselle"]`)
      .click();
    await this.page.waitForLoadState("networkidle");
  }

  async closeUkotusModal() {
    await this.page.click(
      '[aria-label="Sulje valmistelija ja arvioija valitsin"]'
    );
  }

  async openHakemusEditPage(
    reason: string = "Kunhan editoin"
  ): Promise<HakijaAvustusHakuPage> {
    await this.page.getByTestId("virkailija-edit-hakemus").click();
    await this.page.getByTestId("virkailija-edit-comment").type(reason);
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent("page"),
      this.page.getByTestId("virkailija-edit-submit").click(),
    ]);
    await newPage.bringToFront();
    return new HakijaAvustusHakuPage(newPage);
  }

  async createChangeRequest(reason: string = "Täydennäppä") {
    await this.page.getByTestId("request-change-button").click();
    await this.page.getByTestId("täydennyspyyntö__textarea").type(reason);
    await this.page.getByTestId("täydennyspyyntö__lähetä").click();
    await this.waitForSave();
  }

  async cancelChangeRequest() {
    await this.page.getByTestId("täydennyspyyntö__cancel").click();
    await this.waitForSave();
  }

  async selectValmistelijaForHakemus(
    hakemusID: number,
    valmistelijaName: string
  ) {
    await this.openUkotusModal(hakemusID);
    await this.page.click(
      `[aria-label="Lisää ${valmistelijaName} valmistelijaksi"]`
    );
    await expect(
      this.page.locator(
        `[aria-label="Poista ${valmistelijaName} valmistelijan roolista"]`
      )
    ).toBeVisible();
    await this.waitForSave();
    await this.closeUkotusModal();
  }

  async selectArvioijaForHakemus(hakemusID: number, valmistelijaName: string) {
    await this.openUkotusModal(hakemusID);
    await this.page.click(
      `[aria-label="Lisää ${valmistelijaName} arvioijaksi"]`
    );
    await expect(
      this.page.locator(
        `[aria-label="Poista ${valmistelijaName} arvioijan roolista"]`
      )
    ).toBeVisible();
    await this.closeUkotusModal();
  }

  async fillTäydennyspyyntöField(täydennyspyyntöText: string): Promise<void> {
    await clickElementWithText(this.page, "button", "Pyydä täydennystä");
    await this.page
      .getByTestId("täydennyspyyntö__textarea")
      .fill(täydennyspyyntöText);
  }

  async clickToSendTäydennyspyyntö(avustushakuID: number, hakemusID: number) {
    await Promise.all([
      this.page.waitForResponse(
        `${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/hakemus/${hakemusID}/change-requests`
      ),
      this.page.getByTestId("täydennyspyyntö__lähetä").click(),
    ]);
  }

  async acceptBudget(budget: AcceptedBudget) {
    if (typeof budget === "string") {
      await this.page.fill(
        "#budget-edit-project-budget .amount-column input",
        budget
      );
    } else {
      await this.page.click('label[for="useDetailedCosts-true"]');
      await fillBudget(this.page, budget, "virkailija");
    }
    await this.waitForSave();
  }

  async getHakemusID() {
    const hakemusID = await this.page
      .evaluate(() => window.location.pathname.match(/\/hakemus\/(\d+)\//)?.[1])
      .then((possibleHakemusID) => {
        expectToBeDefined(possibleHakemusID);
        return parseInt(possibleHakemusID);
      });
    return hakemusID;
  }

  async selectHakemusFromList(projectName: string) {
    await this.page.click(`text=${projectName}`);
    await this.page.waitForLoadState("networkidle");
    return this.arviointiTabLocators();
  }

  async selectProject(projectCode: string, codes?: VaCodeValues) {
    const { projektikoodi } = this.arviointiTabLocators();
    if (codes && codes.project.length > 1) {
      await projektikoodi.input.click();
      await projektikoodi.option.locator(`text=${projectCode}`).click();
      await this.waitForSave();
    }
    await expect(projektikoodi.value).toContainText(projectCode);
  }

  async acceptAvustushaku({
    projectName,
    budget = "100000",
    rahoitusalue = "Ammatillinen koulutus",
    projektikoodi,
    codes,
  }: {
    avustushakuID: number;
    projectName: string;
    projektikoodi: string;
    budget?: AcceptedBudget;
    rahoitusalue?: string;
    codes?: VaCodeValues;
  }) {
    // Accept the hakemus
    await this.selectHakemusFromList(projectName);
    const hakemusID = await this.getHakemusID();

    await this.selectProject(projektikoodi, codes);

    expectToBeDefined(hakemusID);
    console.log("Hakemus ID:", hakemusID);

    await expect(this.arviointiTabLocators().taTili.value).toContainText(
      rahoitusalue
    );
    await this.waitForSave();
    await this.acceptHakemus(budget);
    return hakemusID;
  }

  async acceptHakemus(budget: AcceptedBudget = "100000") {
    await this.page.click(
      "#arviointi-tab label[for='set-arvio-status-plausible']"
    );
    await this.acceptBudget(budget);
    await this.page.click(
      "#arviointi-tab label[for='set-arvio-status-accepted']"
    );
    await this.waitForSave();
  }

  async rejectHakemus() {
    await this.page.click(
      "#arviointi-tab label[for='set-arvio-status-rejected']"
    );
  }

  async submitHakemus() {
    await this.page.getByTestId("submit-hakemus").click();
  }

  statusFieldSelector(hakemusID: number) {
    return `[data-test-id=muutoshakemus-status-${hakemusID}]`;
  }

  async getLoppuselvitysStatus(hakemusID: number) {
    return this.getSelvitysStatus(hakemusID, "loppu");
  }

  async getVäliselvitysStatus(hakemusID: number) {
    return this.getSelvitysStatus(hakemusID, "vali");
  }

  async getSelvitysStatus(hakemusID: number, type: "vali" | "loppu") {
    const valiselvitysStatus = await this.page.locator(
      `[data-test-id=\"hakemus-${hakemusID}\"] [data-test-class=${type}selvitys-status-cell]`
    );
    return valiselvitysStatus.textContent();
  }

  muutoshakemusStatusFieldContent() {
    return this.page.locator("[data-test-class=muutoshakemus-status-cell]");
  }

  async clickMuutoshakemusStatusField(hakemusID: number) {
    await this.page.click(this.statusFieldSelector(hakemusID));
  }

  async clickMuutoshakemusTab() {
    await this.page.click("span.muutoshakemus-tab");
    await expect(this.page.getByTestId(jatkoaikaTestId)).toBeVisible();
  }

  async validateMuutoshakemusValues(
    muutoshakemus: MuutoshakemusValues,
    paatos?: PaatosValues
  ) {
    await expect(this.page.getByTestId(jatkoaikaTestId)).toHaveText(
      muutoshakemus.jatkoaika!.format("DD.MM.YYYY")
    );
    const jatkoaikaPerustelu = await this.page.textContent(
      "[data-test-id=muutoshakemus-jatkoaika-perustelu]"
    );
    expect(jatkoaikaPerustelu).toEqual(muutoshakemus.jatkoaikaPerustelu);

    if (paatos) {
      await expect(this.page.getByTestId("muutoshakemus-paatos")).toBeVisible();
      const form = await this.page.evaluate(
        (selector: string) => document.querySelectorAll(selector).length,
        '[data-test-id="muutoshakemus-form"]'
      );
      expect(form).toEqual(0);
      const muutospaatosLink = await this.page.textContent(
        "a.muutoshakemus__paatos-link"
      );
      expect(muutospaatosLink).toMatch(
        /https?:\/\/[^\/]+\/muutoshakemus\/paatos\?user-key=[a-f0-9]{64}/
      );
    } else {
      await expect(this.page.getByTestId("muutoshakemus-form")).toBeVisible();
    }
  }

  async selectVakioperusteluInFinnish() {
    await clickElementWithText(this.page, "a", "Lisää vakioperustelu suomeksi");
  }

  async getSisaltomuutosPerustelut() {
    return this.page.innerText('[data-test-id="sisaltomuutos-perustelut"]');
  }

  async getMuutoshakemusNotice() {
    return this.page.innerText(".muutoshakemus-notice");
  }

  async getPaatosPerustelut() {
    return this.page.innerText(
      '[data-test-id="muutoshakemus-form-paatos-reason"]'
    );
  }

  paatosPreview() {
    return {
      open: async () => {
        await Promise.all([
          this.page.click("text=Esikatsele päätösdokumentti"),
          this.page.waitForSelector(".muutoshakemus-paatos__content"),
        ]);
      },
      close: async () => {
        await Promise.all([
          this.page.waitForSelector(".muutoshakemus-paatos__content", {
            state: "detached",
          }),
          this.page.click("text=Sulje"),
        ]);
      },
      title: this.page.locator(".hakemus-details-modal__title-row > span"),
      muutoshakemusPaatosTitle: this.page.getByTestId(
        "muutoshakemus-paatos-title"
      ),
      jatkoaikaPaatos: this.page.getByTestId("paatos-jatkoaika"),
      jatkoaikaValue: this.page.getByTestId("paattymispaiva-value"),
      sisaltoPaatos: this.page.getByTestId("paatos-sisaltomuutos"),
      talousarvioPaatos: this.page.getByTestId("paatos-talousarvio"),
      esittelija: this.page.getByTestId("paatos-esittelija"),
      lisatietoja: this.page.getByTestId("paatos-additional-info"),
      hyvaksyja: this.page.getByTestId("paatos-decider"),
      registerNumber: this.page.getByTestId("paatos-register-number"),
      projectName: this.page.getByTestId("paatos-project-name"),
      org: this.page.locator("h1.muutoshakemus-paatos__org"),
      perustelu: this.page.getByTestId("paatos-reason"),
      existingBudgetTableCells: () =>
        getExistingBudgetTableCells(
          this.page,
          '.muutoshakemus-paatos__content [data-test-id="meno-input-row"]'
        ),
      changedBudgetTableCells: () =>
        getChangedBudgetTableCells(
          this.page,
          '.muutoshakemus-paatos__content [data-test-id="meno-input-row"]'
        ),
    };
  }

  additionalInfo() {
    return {
      locators: {
        showAdditionalInfo: this.page.locator('text="Näytä lisätiedot"'),
        hideAdditionalInfo: this.page.locator('text="Piilota lisätiedot"'),
        toimintayksikko: this.page.getByTestId("lisatiedot-Toimintayksikkö"),
        vastuuvalmistelija: this.page.getByTestId(
          "lisatiedot-Vastuuvalmistelija"
        ),
        paatokset: this.page.locator('[data-test-id="lisatiedot-Päätökset"]'),
        maksatukset: this.page.getByTestId("lisatiedot-Maksatukset"),
        valiselvitykset: this.page.getByTestId("lisatiedot-Väliselvitykset"),
        loppuselvitykset: this.page.getByTestId("lisatiedot-Loppuselvitykset"),
        muutoshakukelpoinen: this.page.getByTestId(
          "lisatiedot-Muutoshakukelpoinen"
        ),
        budjetti: this.page.getByTestId("lisatiedot-Budjetti"),
      },
    };
  }

  async setMuutoshakemusJatkoaikaDecision(
    status: PaatosStatus,
    value?: string
  ) {
    await this.page.click(`label[for="haen-kayttoajan-pidennysta-${status}"]`);
    if (value) {
      await this.page.fill("div.datepicker input", value);
    }
  }

  async writePerustelu(text: string) {
    await this.page.fill("#reason", text);
  }

  async setMuutoshakemusSisaltoDecision(status: PaatosStatus) {
    await this.page.click(`label[for="haen-sisaltomuutosta-${status}"]`);
  }

  async fillMuutoshakemusBudgetAmount(budget: BudgetAmount) {
    await this.page.fill(
      "input[name='talousarvio.personnel-costs-row'][type='number']",
      budget.personnel
    );
    await this.page.fill(
      "input[name='talousarvio.material-costs-row'][type='number']",
      budget.material
    );
    await this.page.fill(
      "input[name='talousarvio.equipment-costs-row'][type='number']",
      budget.equipment
    );
    await this.page.fill(
      "input[name='talousarvio.service-purchase-costs-row'][type='number']",
      budget["service-purchase"]
    );
    await this.page.fill(
      "input[name='talousarvio.rent-costs-row'][type='number']",
      budget.rent
    );
    await this.page.fill(
      "input[name='talousarvio.steamship-costs-row'][type='number']",
      budget.steamship
    );
    await this.page.fill(
      "input[name='talousarvio.other-costs-row'][type='number']",
      budget.other
    );
  }

  async setMuutoshakemusBudgetDecision(
    status: PaatosStatus,
    value?: BudgetAmount
  ) {
    if (status) {
      await this.page.click(`label[for="talousarvio-${status}"]`);
    }
    if (value) {
      await this.fillMuutoshakemusBudgetAmount(value);
    }
  }

  async saveMuutoshakemus() {
    await this.page.click('[data-test-id="muutoshakemus-submit"]');
    await this.page.waitForSelector('[data-test-id="muutoshakemus-paatos"]');
    const statusText = await this.page.textContent(
      '[data-test-id="paatos-status-text"]'
    );
    expect(statusText).toEqual("Käsitelty");
  }

  async getAcceptedBudgetInputAmounts(): Promise<
    { name: string; value: string }[]
  > {
    const inputs = await this.page.$$(
      '[data-test-id="muutoshakemus-form"] [data-test-id="meno-input"] > input'
    );
    return Promise.all(
      inputs.map(async (elem) => {
        const name =
          (await elem.getAttribute("name"))?.replace("talousarvio.", "") || "";
        const value = await elem.inputValue();
        return { name, value };
      })
    );
  }

  async setSelectionCriteriaStars(questionNumber: number, starValue: number) {
    await this.page.click(
      `.valintaperuste-list tr.single-valintaperuste:nth-of-type(${questionNumber}) img:nth-of-type(${starValue})`
    );
  }

  async getHakemusScore(hakemusId: number): Promise<string | undefined> {
    const title = await this.page
      .locator(`[data-test-id=hakemus-scoring-${hakemusId}]`)
      .getAttribute("title");
    const regex = title?.match(/.*Keskiarvo\: ([\S]+).*/);
    return regex?.[1];
  }

  async sortBy(sortKey: string) {
    await this.page.click(`[data-test-id="sort-button-${sortKey}"]`);
  }

  tabs() {
    return {
      seuranta: this.page.locator('[data-test-id="tab-seuranta"]'),
      muutoshakemus: this.page.locator('span:text-is("Muutoshakemukset")'),
    };
  }

  async allowExternalApi(allow: boolean) {
    await this.tabs().seuranta.click();
    await this.page.click(
      `[data-test-id="set-allow-visibility-in-external-system-${allow}"]`
    );
    await this.waitForSave();
  }

  async clickRajaaListaaFilter(category: string, answer: string) {
    await this.page.click('[data-test-id="rajaa-listaa"]');
    const question = this.page.locator(`div:text-matches("${category}", "i")`);
    await question.click();
    await this.page.click(`button:text-matches("${answer}", "i")`);
    await question.click();
    await this.page.click('[data-test-id="rajaa-listaa-close"]');
  }

  getNormalizedBudget() {
    const rowLocator = (key: keyof BudgetAmount) =>
      this.page.locator(`#budget-edit-${key}-costs-row`);
    const getHaettuAmount = (key: keyof BudgetAmount) =>
      rowLocator(key).locator(".original-amount-column");
    const getMyonnettyAmount = (key: keyof BudgetAmount) =>
      rowLocator(key).locator(".amount-column").locator("input");

    const getBudget = (
      budgetType: "haettu" | "myonnetty"
    ): Record<keyof BudgetAmount, Locator> => {
      const getValueFunction =
        budgetType === "haettu" ? getHaettuAmount : getMyonnettyAmount;
      return {
        "service-purchase": getValueFunction("service-purchase"),
        equipment: getValueFunction("equipment"),
        other: getValueFunction("other"),
        material: getValueFunction("material"),
        rent: getValueFunction("rent"),
        steamship: getValueFunction("steamship"),
        personnel: getValueFunction("personnel"),
      };
    };

    return {
      haettu: getBudget("haettu"),
      myonnetty: getBudget("myonnetty"),
    };
  }

  sidebarLocators() {
    const oldAnswer = this.page.locator(".answer-old-value");
    const newAnswer = this.page.locator(".answer-new-value");
    const applicantName = "#applicant-name div";
    const phone = "#textField-0 div";
    const email = "#primary-email div";
    return {
      printableLink: this.page.locator('text="Tulostusversio"'),
      oldAnswers: {
        applicantName: oldAnswer.locator(applicantName),
        phoneNumber: oldAnswer.locator(phone),
        email: oldAnswer.locator(email),
      },
      newAnswers: {
        applicantName: newAnswer.locator(applicantName),
        phoneNumber: newAnswer.locator(phone),
        email: newAnswer.locator(email),
      },
    };
  }

  arviointiTabLocators() {
    const arviointiTab = this.page.locator("#arviointi-tab");
    const budget = this.page
      .locator("#budget-edit-project-budget tfoot td")
      .nth(2)
      .locator("input");
    const traineeLocator = this.page.locator(
      "#trainee-day-edit-trainee-day-summary tbody tr td"
    );
    return {
      resendPaatokset: this.page.locator(
        'text="Lähetä päätössähköposti uudestaan"'
      ),
      paatoksetResent: this.page.locator('text="Sähköposti lähetetty"'),
      comments: {
        input: this.page.locator("#comment-input"),
        sendButton: this.page.locator("[data-test-id=send-comment]"),
        commentAdded: this.page.locator('text="Kommentti lisätty"'),
        comment: this.page
          .locator(".comment-list")
          .locator(".single-comment")
          .locator("div"),
      },
      taTili: createReactSelectLocators(arviointiTab, "tatiliSelection"),
      projektikoodi: createReactSelectLocators(
        arviointiTab,
        "code-value-dropdown-project-id"
      ),
      budget,
      koulutusosio: {
        osioName: traineeLocator.nth(0),
        osio: {
          haettu: traineeLocator.nth(1),
          hyvaksyttyInput: traineeLocator
            .nth(2)
            .locator(
              `[id="trainee-day-edit-koulutusosiot.koulutusosio-1.koulutettavapaivat.scope"]`
            ),
          haettuOsallistujaMaara: traineeLocator.nth(3),
          hyvaksyttyOsallistujaMaaraInput: traineeLocator
            .nth(4)
            .locator(
              `[id="trainee-day-edit-koulutusosiot.koulutusosio-1.koulutettavapaivat.person-count"]`
            ),
        },
      },
    };
  }

  muutoshakemusTabLocators() {
    return {
      hakijaPerustelut: this.page.getByTestId("muutoshakemus-reasoning-title"),
      oldBudgetTitle: this.page.getByTestId("budget-old-title"),
      currentBudgetTitle: this.page.getByTestId("budget-change-title"),
    };
  }

  seurantaTabLocators() {
    return {
      grantedTotal: this.page.getByTestId("granted-total"),
      amountTotal: this.page.getByTestId("amount-total"),
      kustannusMyonnetty: this.page.locator(
        '#budget-edit-project-budget tfoot [class="granted-amount-column"] [class="money"]'
      ),
      kustannusHyvaksytty: this.page.locator(
        '#budget-edit-project-budget [class="amount-column"] [class="money sum"]'
      ),
    };
  }
}
