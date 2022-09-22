import { expect, Locator, Page } from "@playwright/test";

import { navigate } from "../utils/navigate";
import {
  clearAndType,
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
} from "../utils/types";
import {
  AcceptedBudget,
  Budget,
  BudgetAmount,
  defaultBudget,
} from "../utils/budget";
import { HakijaAvustusHakuPage } from "./hakijaAvustusHakuPage";
import { createReactSelectLocators } from "../utils/react-select";

const jatkoaikaSelector = "[data-test-id=muutoshakemus-jatkoaika]" as const;

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
    this.inputFilterOrganization = this.page.locator(
      '[placeholder="Hakijaorganisaatio"]'
    );
    this.inputFilterProject = this.page.locator(
      '[placeholder="Asiatunnus tai hanke"]'
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
      this.page.click(`[data-test-id="hakemus-${hakemusID}"]`),
    ]);
  }

  async openUkotusModal(hakemusID: number) {
    await this.page
      .locator(`[data-test-id=hakemus-${hakemusID}]`)
      .locator(`[aria-label="Lisää valmistelija hakemukselle"]`)
      .click();
  }

  async closeUkotusModal() {
    await this.page.click(
      '[aria-label="Sulje valmistelija ja arvioija valitsin"]'
    );
  }

  async openHakemusEditPage(
    reason: string = "Kunhan editoin"
  ): Promise<HakijaAvustusHakuPage> {
    await this.page.click("[data-test-id=virkailija-edit-hakemus]");
    await this.page.type("[data-test-id=virkailija-edit-comment]", reason);
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent("page"),
      this.page.click("[data-test-id=virkailija-edit-submit]"),
    ]);
    await newPage.bringToFront();
    return new HakijaAvustusHakuPage(newPage);
  }

  async createChangeRequest(reason: string = "Täydennäppä") {
    await this.page.click('[data-test-id="request-change-button"]');
    await this.page.type('[data-test-id="täydennyspyyntö__textarea"]', reason);
    await this.page.click('[data-test-id="täydennyspyyntö__lähetä"]');
    await this.waitForSave();
  }

  async cancelChangeRequest() {
    await this.page.click('[data-test-id="täydennyspyyntö__cancel"]');
    await this.waitForSave();
  }

  async waitForArvioSave(avustushakuID: number, hakemusID: number) {
    await this.page.waitForResponse(
      (response) =>
        response.url() ===
          `${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/hakemus/${hakemusID}/arvio` &&
        response.ok()
    );
  }

  async selectValmistelijaForHakemus(
    hakemusID: number,
    valmistelijaName: string
  ) {
    await this.openUkotusModal(hakemusID);
    await this.page.click(
      `[aria-label="Lisää ${valmistelijaName} valmistelijaksi"]`
    );
    await this.page
      .locator(
        `[aria-label="Poista ${valmistelijaName} valmistelijan roolista"]`
      )
      .waitFor();
    await this.closeUkotusModal();
  }

  async selectArvioijaForHakemus(hakemusID: number, valmistelijaName: string) {
    await this.openUkotusModal(hakemusID);
    await this.page.click(
      `[aria-label="Lisää ${valmistelijaName} arvioijaksi"]`
    );
    await this.page
      .locator(`[aria-label="Poista ${valmistelijaName} arvioijan roolista"]`)
      .waitFor();
    await this.closeUkotusModal();
  }

  async fillTäydennyspyyntöField(täydennyspyyntöText: string): Promise<void> {
    await clickElementWithText(this.page, "button", "Pyydä täydennystä");
    await this.page.fill(
      "[data-test-id='täydennyspyyntö__textarea']",
      täydennyspyyntöText
    );
  }

  async clickToSendTäydennyspyyntö(avustushakuID: number, hakemusID: number) {
    await Promise.all([
      this.page.waitForResponse(
        `${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/hakemus/${hakemusID}/change-requests`
      ),
      this.page.click("[data-test-id='täydennyspyyntö__lähetä']"),
    ]);
  }

  async fillBudget(
    budget: Budget = defaultBudget,
    type: "hakija" | "virkailija"
  ) {
    const prefix = type === "virkailija" ? "budget-edit-" : "";

    await clearAndType(
      this.page,
      `[id='${prefix}personnel-costs-row.description']`,
      budget.description.personnel
    );
    await clearAndType(
      this.page,
      `[id='${prefix}personnel-costs-row.amount']`,
      budget.amount.personnel
    );
    await clearAndType(
      this.page,
      `[id='${prefix}material-costs-row.description']`,
      budget.description.material
    );
    await clearAndType(
      this.page,
      `[id='${prefix}material-costs-row.amount']`,
      budget.amount.material
    );
    await clearAndType(
      this.page,
      `[id='${prefix}equipment-costs-row.description']`,
      budget.description.equipment
    );
    await clearAndType(
      this.page,
      `[id='${prefix}equipment-costs-row.amount']`,
      budget.amount.equipment
    );
    await clearAndType(
      this.page,
      `[id='${prefix}service-purchase-costs-row.description']`,
      budget.description["service-purchase"]
    );
    await clearAndType(
      this.page,
      `[id='${prefix}service-purchase-costs-row.amount']`,
      budget.amount["service-purchase"]
    );
    await clearAndType(
      this.page,
      `[id='${prefix}rent-costs-row.description']`,
      budget.description.rent
    );
    await clearAndType(
      this.page,
      `[id='${prefix}rent-costs-row.amount']`,
      budget.amount.rent
    );
    await clearAndType(
      this.page,
      `[id='${prefix}steamship-costs-row.description']`,
      budget.description.steamship
    );
    await clearAndType(
      this.page,
      `[id='${prefix}steamship-costs-row.amount']`,
      budget.amount.steamship
    );
    await clearAndType(
      this.page,
      `[id='${prefix}other-costs-row.description']`,
      budget.description.other
    );

    await clearAndType(
      this.page,
      `[id='${prefix}other-costs-row.amount']`,
      budget.amount.other
    );

    if (type === "hakija") {
      await this.page.fill(
        `[id='${prefix}self-financing-amount']`,
        budget.selfFinancing
      );
    }
  }

  async acceptBudget(budget: AcceptedBudget) {
    if (typeof budget === "string") {
      await this.page.fill(
        "#budget-edit-project-budget .amount-column input",
        budget
      );
    } else {
      await this.page.click('label[for="useDetailedCosts-true"]');
      await this.fillBudget(budget, "virkailija");
    }
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
  }

  async acceptAvustushaku({
    avustushakuID,
    projectName,
    budget = "100000",
    rahoitusalue = "Ammatillinen koulutus",
    projektikoodi,
  }: {
    avustushakuID: number;
    projectName: string;
    projektikoodi: string;
    budget?: AcceptedBudget;
    rahoitusalue?: string;
  }) {
    // Accept the hakemus
    await this.selectHakemusFromList(projectName);
    const hakemusID = await this.getHakemusID();

    const selectProject = async (projectId: string) => {
      if (!projektikoodi) throw new Error("No project selected");

      await this.page
        .locator("text=Syötä projektikoodi")
        .click({ force: true });
      await this.page
        .locator(
          `[data-test-id="projekti-valitsin-initial"] [data-test-id="${projectId}"]`
        )
        .click({ force: true });
    };

    await selectProject(projektikoodi);

    expectToBeDefined(hakemusID);
    console.log("Hakemus ID:", hakemusID);

    const { taTili } = this.arviointiTabLocators();
    await taTili.input.fill(rahoitusalue);
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");
    await this.waitForSave();

    await this.acceptHakemus(budget);
    await this.waitForArvioSave(avustushakuID, hakemusID);
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
  }

  async rejectHakemus() {
    await this.page.click(
      "#arviointi-tab label[for='set-arvio-status-rejected']"
    );
  }

  async submitHakemus() {
    await this.page.click('[data-test-id="submit-hakemus"]');
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
    await this.page.waitForSelector(jatkoaikaSelector);
  }

  async validateMuutoshakemusValues(
    muutoshakemus: MuutoshakemusValues,
    paatos?: PaatosValues
  ) {
    const jatkoaika = await this.page.textContent(jatkoaikaSelector);
    expect(jatkoaika).toEqual(muutoshakemus.jatkoaika?.format("DD.MM.YYYY"));
    const jatkoaikaPerustelu = await this.page.textContent(
      "[data-test-id=muutoshakemus-jatkoaika-perustelu]"
    );
    expect(jatkoaikaPerustelu).toEqual(muutoshakemus.jatkoaikaPerustelu);

    if (paatos) {
      await this.page.waitForSelector('[data-test-id="muutoshakemus-paatos"]');
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
      await this.page.waitForSelector('[data-test-id="muutoshakemus-form"]');
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
      muutoshakemusPaatosTitle: this.page.locator(
        "[data-test-id=muutoshakemus-paatos-title]"
      ),
      jatkoaikaPaatos: this.page.locator('[data-test-id="paatos-jatkoaika"]'),
      jatkoaikaValue: this.page.locator(
        '[data-test-id="paattymispaiva-value"]'
      ),
      sisaltoPaatos: this.page.locator('[data-test-id="paatos-sisaltomuutos"]'),
      talousarvioPaatos: this.page.locator(
        '[data-test-id="paatos-talousarvio"]'
      ),
      esittelija: this.page.locator('[data-test-id="paatos-esittelija"]'),
      lisatietoja: this.page.locator('[data-test-id="paatos-additional-info"]'),
      hyvaksyja: this.page.locator('[data-test-id="paatos-decider"]'),
      registerNumber: this.page.locator(
        '[data-test-id="paatos-register-number"]'
      ),
      projectName: this.page.locator('[data-test-id="paatos-project-name"]'),
      org: this.page.locator("h1.muutoshakemus-paatos__org"),
      perustelu: this.page.locator('[data-test-id="paatos-reason"]'),
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
        toimintayksikko: this.page.locator(
          '[data-test-id="lisatiedot-Toimintayksikkö"]'
        ),
        vastuuvalmistelija: this.page.locator(
          '[data-test-id="lisatiedot-Vastuuvalmistelija"]'
        ),
        paatokset: this.page.locator('[data-test-id="lisatiedot-Päätökset"]'),
        maksatukset: this.page.locator(
          '[data-test-id="lisatiedot-Maksatukset"]'
        ),
        valiselvitykset: this.page.locator(
          '[data-test-id="lisatiedot-Väliselvitykset"]'
        ),
        loppuselvitykset: this.page.locator(
          '[data-test-id="lisatiedot-Loppuselvitykset"]'
        ),
        muutoshakukelpoinen: this.page.locator(
          '[data-test-id="lisatiedot-Muutoshakukelpoinen"]'
        ),
        budjetti: this.page.locator('[data-test-id="lisatiedot-Budjetti"]'),
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

  async getNormalizedBudget(): Promise<{
    haettu: BudgetAmount;
    myonnetty: BudgetAmount;
  }> {
    await this.page.waitForSelector("#budget-edit-project-budget");
    const rowLocator = (key: keyof BudgetAmount) =>
      this.page.locator(`#budget-edit-${key}-costs-row`);
    const getHaettuAmount = (key: keyof BudgetAmount) =>
      rowLocator(key).locator(".original-amount-column").innerText();
    const getMyonnettyAmount = (key: keyof BudgetAmount) =>
      rowLocator(key).locator(".amount-column").locator("input").inputValue();

    const getBudget = async (
      budgetType: "haettu" | "myonnetty"
    ): Promise<Record<keyof BudgetAmount, string>> => {
      const getValueFunction =
        budgetType === "haettu" ? getHaettuAmount : getMyonnettyAmount;
      return {
        "service-purchase": await getValueFunction("service-purchase"),
        equipment: await getValueFunction("equipment"),
        other: await getValueFunction("other"),
        material: await getValueFunction("material"),
        rent: await getValueFunction("rent"),
        steamship: await getValueFunction("steamship"),
        personnel: await getValueFunction("personnel"),
      };
    };

    return {
      haettu: await getBudget("haettu"),
      myonnetty: await getBudget("myonnetty"),
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
    };
  }

  muutoshakemusTabLocators() {
    return {
      hakijaPerustelut: this.page.locator(
        '[data-test-id="muutoshakemus-reasoning-title"]'
      ),
      oldBudgetTitle: this.page.locator('[data-test-id="budget-old-title"]'),
      currentBudgetTitle: this.page.locator(
        '[data-test-id="budget-change-title"]'
      ),
    };
  }

  seurantaTabLocators() {
    return {
      grantedTotal: this.page.locator("[data-test-id=granted-total]"),
      amountTotal: this.page.locator("[data-test-id=amount-total]"),
      kustannusMyonnetty: this.page.locator(
        '#budget-edit-project-budget tfoot [class="granted-amount-column"] [class="money"]'
      ),
      kustannusHyvaksytty: this.page.locator(
        '#budget-edit-project-budget [class="amount-column"] [class="money sum"]'
      ),
    };
  }
}
