import { Dialog, expect, Locator, Page } from "@playwright/test";
import { Response } from "playwright-core";
import moment from "moment";
import fs from "fs/promises";
import path from "path";

import { navigate } from "../utils/navigate";
import {
  clickElementWithText,
  expectQueryParameter,
  expectToBeDefined,
} from "../utils/util";
import { VIRKAILIJA_URL } from "../utils/constants";
import { VaCodeValues, Field, NoProjectCodeProvided } from "../utils/types";
import { addFieldsToHakemusJson } from "../utils/hakemus-json";
import { Talousarviotili } from "../../va-virkailija/web/va/koodienhallinta/types";
import { createReactSelectLocators } from "../utils/react-select";

interface Raportointivelvoite {
  raportointilaji: string;
  maaraaika: string;
  ashaTunnus: string;
  lisatiedot?: string;
}

export interface HakuProps {
  avustushakuName: string;
  randomName: string;
  registerNumber: string;
  vaCodes: VaCodeValues;
  hakuaikaStart: Date;
  hakuaikaEnd: Date;
  arvioituMaksupaiva?: Date;
  lainsaadanto: string[];
  hankkeenAlkamispaiva: string;
  hankkeenPaattymispaiva: string;
  selectionCriteria: string[];
  raportointivelvoitteet: Raportointivelvoite[];
  hakemusFields: Field[];
  jaossaOlevaSumma?: number;
  installment?: Installment;
  talousarviotili: Talousarviotili;
}

export enum Installment {
  OneInstallment,
  MultipleInstallments,
}

const dateFormat = "D.M.YYYY H.mm";
const formatDate = (date: Date | moment.Moment) =>
  moment(date).format(dateFormat);
export const parseDate = (input: string) => moment(input, dateFormat).toDate();

const saveStatusSelector = '[data-test-id="save-status"]';

export class FormEditorPage {
  readonly page: Page;
  formErrorState: Locator;
  form: Locator;
  fieldId: Locator;
  saveFormButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.formErrorState = this.page.locator(
      '[data-test-id="form-error-state"]'
    );
    this.form = this.page.locator(".form-json-editor textarea");
    this.fieldId = this.page.locator("span.soresu-field-id");
    this.saveFormButton = this.page.locator("#saveForm");
  }

  async changeLomakeJson(lomakeJson: string) {
    await this.form.waitFor();
    /*
      for some reason
      await this.page.fill(".form-json-editor textarea", lomakeJson)
      takes almost 50seconds
     */
    await this.form.evaluate((textarea, lomakeJson) => {
      (textarea as HTMLTextAreaElement).value = lomakeJson;
    }, lomakeJson);

    await this.formErrorState.waitFor({ state: "hidden" });
    // trigger autosave by typing space in the end
    await this.form.type(" ");
    await this.page.keyboard.press("Backspace");
  }

  async saveForm() {
    const savedSuccessfully = this.page
      .locator(saveStatusSelector)
      .locator("text=Kaikki tiedot tallennettu");
    await expect(savedSuccessfully).toBeHidden();
    await this.saveFormButton.click();
    await expect(savedSuccessfully).toBeVisible();
  }

  async getFieldIds() {
    const ids = await this.fieldId.evaluateAll((elems) =>
      elems.map((e) => e.textContent)
    );
    return ids.filter((id): id is string => id !== null);
  }

  async addField(afterFieldId: string, newFieldType: string) {
    await this.page.hover(`[data-test-id="field-add-${afterFieldId}"]`);
    await this.page.click(
      `[data-test-id="field-${afterFieldId}"] [data-test-id="add-field-${newFieldType}"]`
    );
    await this.fieldId.first(); // hover on something else so that the added content from first hover doesn't change page coordinates
  }

  async removeField(fieldId: string) {
    async function acceptDialog(dialog: Dialog) {
      await dialog.accept("Oletko varma, että haluat poistaa kentän?");
    }
    this.page.on("dialog", acceptDialog);
    const fieldIdWithText = `text="${fieldId}"`;
    await this.fieldId.locator(fieldIdWithText).waitFor();
    await Promise.all([
      // without position this clicks the padding and does nothing
      this.page.click(`[data-test-id="delete-field-${fieldId}"]`, {
        position: { x: 15, y: 5 },
      }),
      this.fieldId.locator(fieldIdWithText).waitFor({ state: "detached" }),
    ]);
    this.page.removeListener("dialog", acceptDialog);
  }

  async moveField(fieldId: string, direction: "up" | "down") {
    const fields = await this.getFieldIds();
    const originalIndex = fields.indexOf(fieldId);
    const expectedIndex =
      direction === "up" ? originalIndex - 1 : originalIndex + 1;
    await this.page.click(
      `[data-test-id="move-field-${direction}-${fieldId}"]`
    );
    await this.page.waitForFunction(
      ({ fieldId, expectedIndex }) => {
        const fieldIds = Array.from(
          document.querySelectorAll("span.soresu-field-id")
        ).map((e) => e.textContent);
        return fieldIds[expectedIndex] === fieldId;
      },
      { expectedIndex, fieldId }
    );
  }

  async addKoodisto(koodisto: string) {
    await this.page.locator(".soresu-field-add-header").first().hover();
    await this.page.click("text=Koodistokenttä");
    await this.page.click(`text="${koodisto}"`);
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");
    await this.page.locator('label:text-is("Pudotusvalikko")').first().click();
  }

  fieldJson(type: string, id: string, label: string) {
    return {
      fieldClass: "wrapperElement",
      id: id + "wrapper",
      fieldType: "theme",
      children: [
        {
          label: {
            fi: label + "fi",
            sv: label + "sv",
          },
          fieldClass: "formField",
          helpText: {
            fi: "helpText fi",
            sv: "helpText sv",
          },
          id: id,
          params: {
            size: "small",
            maxlength: 1000,
          },
          required: true,
          fieldType: type,
        },
      ],
    };
  }

  async addFields(...fields: (Field & { fieldLabel: string })[]) {
    const formContent = await this.form.textContent();
    expectToBeDefined(formContent);
    const json = JSON.parse(formContent);
    const { content } = json;
    const fieldsJson = fields.map(({ fieldId, type, fieldLabel }) =>
      this.fieldJson(type, fieldId, fieldLabel)
    );
    const newJson = { ...json, content: [...content, ...fieldsJson] };
    await this.changeLomakeJson(JSON.stringify(newJson));
    await this.saveForm();
  }
}

function SelvitysTab(page: Page) {
  const titleSelector = '[name="applicant-info-label-fi"]';

  async function save() {
    await Promise.all([
      page.click('text="Tallenna"'),
      page.waitForResponse(
        (response) =>
          response.status() === 200 && isSelvitysSavedResponse(response)
      ),
    ]);
  }

  function isSelvitysSavedResponse(response: Response) {
    if (response.request().method() !== "POST") return false;
    return (
      response.url().endsWith("/selvitysform/valiselvitys") ||
      response.url().endsWith("/selvitysform/loppuselvitys")
    );
  }

  async function setSelvitysTitleFi(title: string) {
    await page.fill(titleSelector, title);
    await save();
  }

  async function getSelvitysTitleFi() {
    return await page.textContent(titleSelector);
  }

  async function openFormPreview(selector: string) {
    const [previewPage] = await Promise.all([
      page.context().waitForEvent("page"),
      await page.click(selector),
    ]);
    await previewPage.bringToFront();
    return previewPage;
  }

  async function openFormPreviewFi() {
    return await openFormPreview(`[data-test-id='form-preview-fi']`);
  }

  async function openFormPreviewSv() {
    return await openFormPreview(`[data-test-id='form-preview-sv']`);
  }

  return {
    getSelvitysTitleFi,
    setSelvitysTitleFi,
    openFormPreviewFi,
    openFormPreviewSv,
  };
}

export class HakujenHallintaPage {
  readonly page: Page;
  readonly paatosUpdatedAt: Locator;
  readonly valiselvitysUpdatedAt: Locator;
  readonly loppuselvitysUpdatedAt: Locator;
  readonly decisionEditor: Locator;
  readonly loadingAvustushaku: Locator;

  constructor(page: Page) {
    this.page = page;
    this.paatosUpdatedAt = this.page.locator("#paatosUpdatedAt");
    this.valiselvitysUpdatedAt = this.page.locator("#valiselvitysUpdatedAt");
    this.loppuselvitysUpdatedAt = this.page.locator("#loppuselvitysUpdatedAt");
    this.decisionEditor = this.page.locator(".decision-editor");
    this.loadingAvustushaku = this.page
      .locator(saveStatusSelector)
      .locator("text=Ladataan tietoja");
  }

  async navigateFromHeader() {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "networkidle" }),
      this.page.locator(`text="Hakujen hallinta"`).click(),
    ]);
  }

  async navigateTo(path: string) {
    await navigate(this.page, path);
    await this.page.waitForLoadState("networkidle");
  }

  async navigate(avustushakuID: number) {
    await this.navigateTo(`/admin/haku-editor/?avustushaku=${avustushakuID}`);
  }

  async navigateToDefaultAvustushaku() {
    await this.navigateTo("/admin/haku-editor/");
  }

  async navigateToHakemusByClicking(avustushakuName: string) {
    await this.navigate(0);
    const { avustushaku } = this.hakuListingTableSelectors();
    await avustushaku.input.fill(avustushakuName);
    const listItemSelector = await this.page.locator(
      `[data-test-id="${avustushakuName}"]`
    );
    await expect(this.loadingAvustushaku).toBeHidden();
    await Promise.all([
      this.page.waitForNavigation(),
      expect(this.loadingAvustushaku).toBeVisible(),
      listItemSelector.click(),
    ]);
    await expect(this.loadingAvustushaku).toBeHidden();
  }

  async navigateToPaatos(avustushakuID: number) {
    await this.navigateTo(`/admin/decision/?avustushaku=${avustushakuID}`);
    return this.paatosLocators();
  }

  async navigateToValiselvitys(avustushakuID: number) {
    await this.navigateTo(`/admin/valiselvitys/?avustushaku=${avustushakuID}`);
  }

  async navigateToLoppuselvitys(avustushakuID: number) {
    await this.navigateTo(`/admin/loppuselvitys/?avustushaku=${avustushakuID}`);
  }

  async navigateToFormEditor(avustushakuID: number) {
    await this.navigateTo(`/admin/form-editor/?avustushaku=${avustushakuID}`);
    return new FormEditorPage(this.page);
  }

  async switchToFormEditorTab() {
    await this.page.locator('span:text-is("Hakulomake")').click();
    return new FormEditorPage(this.page);
  }

  async switchToHaunTiedotTab() {
    await this.page.click('[data-test-id="haun-tiedot-välilehti"]');
    await expect(this.page.locator("#register-number")).toBeVisible();
  }

  async switchToPaatosTab() {
    await this.page.click('[data-test-id="päätös-välilehti"]');
    return this.paatosLocators();
  }

  paatosLocators() {
    const datePicker = "div.datepicker input";
    const alkamisPaiva = this.page.locator(
      '[data-test-id="hankkeen-alkamispaiva"]'
    );
    const label = '[data-test-id="label"]';
    const paattymisPaiva = this.page.locator(
      '[data-test-id="hankkeen-paattymispaiva"]'
    );
    return {
      hankkeenAlkamisPaiva: alkamisPaiva.locator(datePicker),
      hankkeenAlkamisPaivaLabel: alkamisPaiva.locator(label),
      hankkeenPaattymisPaiva: paattymisPaiva.locator(datePicker),
      hankkeenPaattymisPaivaLabel: paattymisPaiva.locator(label),
      sendPaatokset: (amount: number = 1) =>
        this.page.locator(`text="Lähetä ${amount} päätöstä"`),
      confirmSending: this.page.locator('text="Vahvista lähetys"'),
      paatosSendError: this.page.locator("#päätös-send-error"),
      recreatePaatokset: async () => {
        await this.page.locator("text=Luo päätökset uudelleen").click();
        await this.page.locator("text=Vahvista päätösten luominen").click();
        await expect(
          this.page.locator("text=Päätökset luotu uudelleen")
        ).toBeVisible();
      },
      resendPaatokset: async (amount: number = 1) => {
        await this.page
          .locator(`text=Lähetä ${amount} päätöstä uudelleen`)
          .click();
        await this.page
          .locator("text=Vahvista päätösten uudelleenlähetys")
          .click();
        await expect(
          this.page.locator("text=Päätökset lähetetty uudelleen")
        ).toBeVisible();
      },
      yleisOhjeCheckbox: this.page
        .locator("label")
        .locator('text="Valtionavustusten yleisohje"'),
      yleisOhjeLiite: this.page.locator("[data-liite=va_yleisohje]"),
      pakoteOhjeCheckbox: this.page
        .locator("label")
        .locator(
          "text=Venäjän hyökkäyssotaan liittyvien pakotteiden huomioon ottaminen valtionavustustoiminnassa"
        ),
    };
  }

  async switchToValiselvitysTab() {
    await this.page.click('[data-test-id="väliselvitys-välilehti"]');
    return SelvitysTab(this.page);
  }

  async switchToLoppuselvitysTab() {
    await this.page.click('[data-test-id="loppuselvitys-välilehti"]');
    return SelvitysTab(this.page);
  }

  async sendValiselvitys() {
    await this.page.click('text="Lähetä väliselvityspyynnöt"');
  }

  async sendLoppuselvitys() {
    await this.page.click('text="Lähetä loppuselvityspyynnöt"');
    await this.page.waitForSelector('text="Lähetetty 1 viestiä"');
  }

  async waitForSave() {
    await expect(
      this.page
        .locator(saveStatusSelector)
        .locator('text="Kaikki tiedot tallennettu"')
    ).toBeVisible({ timeout: 10000 });
  }

  async searchUsersForRoles(user: string) {
    await Promise.all([
      this.page.waitForResponse(`${VIRKAILIJA_URL}/api/va-user/search`),
      this.page.fill("#va-user-search-input", user),
    ]);
  }

  async searchUsersForVastuuvalmistelija(user: string) {
    await Promise.all([
      this.page.waitForResponse(`${VIRKAILIJA_URL}/api/va-user/search`),
      this.page.fill("#va-user-search-vastuuvalmistelija", user),
    ]);
  }

  async clearUserSearchForRoles() {
    await this.page.click('[data-test-id="clear-role-search"]');
  }

  async clearUserSearchForVastuuvalmistelija() {
    await this.page.click('[data-test-id="clear-vastuuvalmistelija-search"]');
  }

  async fillVastuuvalmistelijaName(name: string) {
    await Promise.all([
      this.waitForRolesSaved(),
      this.page.fill('[data-test-id="vastuuvalmistelija-name"]', name),
    ]);
  }

  async fillVastuuvalmistelijaEmail(email: string) {
    await Promise.all([
      this.waitForRolesSaved(),
      this.page.fill('[data-test-id="vastuuvalmistelija-email"]', email),
    ]);
  }

  async selectUser(user: string) {
    await Promise.all([
      this.waitForRolesSaved(),
      clickElementWithText(this.page, "a", user),
    ]);
  }

  async removeUser(name: string) {
    const testId = "role-" + name.toLowerCase().replace(" ", "-");
    await Promise.all([
      this.waitForRolesSaved(),
      this.page.click(`[data-test-id="${testId}"] button.remove`),
    ]);
  }

  async setUserRole(
    name: string,
    role: "presenting_officer" | "evaluator" | "vastuuvalmistelija"
  ) {
    const testId = "role-" + name.toLowerCase().replace(" ", "-");
    await Promise.all([
      this.waitForRolesSaved(),
      this.page
        .selectOption(`[data-test-id="${testId}"] select[name=role]`, role)
        .then((_) => this.page.keyboard.press("Tab")), // tab out of the field to trigger save
    ]);
  }

  async waitForRolesSaved() {
    return await Promise.all([
      this.page.waitForResponse(
        new RegExp(`${VIRKAILIJA_URL}/api/avustushaku/\\d+/role(/\\d+)?`)
      ),
      this.page.waitForResponse(
        new RegExp(`${VIRKAILIJA_URL}/api/avustushaku/\\d+/privileges`)
      ),
    ]);
  }

  async setLoppuselvitysDate(value: string) {
    await this.page.fill(
      '[data-test-id="loppuselvityksen-aikaraja"] div.datepicker input',
      value
    );
    await this.page.keyboard.press("Tab");
  }

  async setValiselvitysDate(value: string) {
    await this.page.fill(
      '[data-test-id="valiselvityksen-aikaraja"] div.datepicker input',
      value
    );
    await this.page.keyboard.press("Tab");
  }

  async sendPaatos(avustushakuID: number, amount = 1) {
    const locators = this.paatosLocators();
    await locators.sendPaatokset(amount).click();
    await Promise.all([
      this.page.waitForResponse(
        `${VIRKAILIJA_URL}/api/paatos/sendall/${avustushakuID}`
      ),
      locators.confirmSending.click(),
    ]);
    const tapahtumaloki = await this.page.waitForSelector(".tapahtumaloki");
    const logEntryCount = await tapahtumaloki.evaluate(
      (e) => e.querySelectorAll(".entry").length
    );
    expect(logEntryCount).toEqual(1);
  }

  async resolveAvustushaku() {
    await this.page.click("label[for='set-status-resolved']");
    await this.waitForSave();
  }

  async copyCurrentHaku(): Promise<number> {
    const hakuNameFi = this.hauntiedotLocators().hakuName.fi;
    const currentHakuTitle = await hakuNameFi.textContent();
    await clickElementWithText(this.page, "a", "Kopioi uuden pohjaksi");
    await expect(hakuNameFi).toHaveText(`${currentHakuTitle} (kopio)`);
    await this.page.waitForLoadState("networkidle");

    const avustushakuID = parseInt(
      await expectQueryParameter(this.page, "avustushaku")
    );
    console.log(`Avustushaku ID: ${avustushakuID}`);
    return avustushakuID;
  }

  async copyEsimerkkihaku(): Promise<number> {
    await this.navigate(2);
    return await this.copyCurrentHaku();
  }

  dropdownSelector(codeType: "operational-unit" | "project" | "operation") {
    return `[data-test-id=code-value-dropdown__${codeType}]`;
  }

  async overrideProject(code: string, codeToOverride: string) {
    await this.page.click(
      `[data-test-id="projekti-valitsin-${codeToOverride}"] input`
    );
    await this.page.click(`[data-test-id='${code}']`);
  }

  async selectProject(code: string) {
    if (!code) throw new Error("No project code provided, cannot continue");

    await this.page.click(`.projekti-valitsin input`);
    await this.page.type(`.projekti-valitsin input`, code);
    await this.page.click(`[data-test-id='${code}']`);
  }

  async selectVaCodes(codes: VaCodeValues | undefined) {
    if (!codes) throw new Error("No VaCodeValues provided, cannot continue");

    await this.selectCode("operational-unit", codes.operationalUnit);

    for (const projectCode of codes.project) {
      if (projectCode !== NoProjectCodeProvided.code) {
        await this.addProjectRow();
        await this.overrideProject(projectCode, NoProjectCodeProvided.code);
      }
    }

    await this.selectCode("operation", codes.operation);
  }

  async selectVaCodesAndWaitForSave(codes: VaCodeValues | undefined) {
    const longTimeoutAsSelectingCodesMightTakeAWhile = 10000;
    await Promise.all([
      this.selectVaCodes(codes),
      expect(
        this.page.locator(saveStatusSelector).locator("text=Tallennetaan")
      ).toBeVisible(),
      expect(
        this.page
          .locator(saveStatusSelector)
          .locator("text=Kaikki tiedot tallennettu")
      ).toBeVisible({ timeout: longTimeoutAsSelectingCodesMightTakeAWhile }),
    ]);
  }

  async addProjectRow() {
    await this.page.click(`.lisaa-projekti`);
  }

  async removeProjectRow(projectToRemove: string) {
    await this.page.click(
      `[data-test-id="projekti-valitsin-${projectToRemove}"] .poista-projekti`
    );
  }

  async selectCode(
    codeType: "operational-unit" | "project" | "operation",
    code: string
  ): Promise<void> {
    await this.page.click(`${this.dropdownSelector(codeType)} > div`);
    await this.page.click(`[data-test-id='${code}']`);
  }

  raportointilajiSelector(index: number) {
    return `[id="raportointilaji-dropdown-${index}"]`;
  }

  async selectRaportointilaji(
    index: number,
    raportointilaji: string
  ): Promise<void> {
    await this.page.click(`${this.raportointilajiSelector(index)} > div`);
    await this.page.click(`[data-test-id='${raportointilaji}']`);
  }

  async fillCode(
    codeType: "operational-unit" | "project" | "operation",
    code: string
  ): Promise<void> {
    await this.page.fill(
      `${this.dropdownSelector(codeType)} > div input`,
      `${code}`
    );
  }

  async getInputOptionCodeStyles(code: string): Promise<CSSStyleDeclaration> {
    const selectableOptionElement = await this.page.waitForSelector(
      `[data-test-id="${code}"]`
    );
    return await this.page.evaluate(
      (e) => getComputedStyle(e),
      selectableOptionElement
    );
  }

  async getInputPlaceholderCodeStyles(
    codeType: "operational-unit" | "project" | "operation"
  ): Promise<CSSStyleDeclaration> {
    const selectableOptionElement = await this.page.waitForSelector(
      `[data-test-id="singlevalue-${codeType}"]`
    );
    return await this.page.evaluate(
      (e) => getComputedStyle(e),
      selectableOptionElement
    );
  }

  async selectTositelaji(value: "XE" | "XB"): Promise<void> {
    await this.page.selectOption("select#document-type", value);
  }

  async fillAvustushaku({
    avustushakuName,
    registerNumber,
    hakuaikaStart,
    hakuaikaEnd,
    hankkeenAlkamispaiva,
    hankkeenPaattymispaiva,
    selectionCriteria,
    arvioituMaksupaiva,
    lainsaadanto,
    jaossaOlevaSumma,
    raportointivelvoitteet,
    installment,
    talousarviotili,
    vaCodes,
  }: HakuProps) {
    await this.page.fill("#register-number", registerNumber);
    await this.hauntiedotLocators().hakuName.fi.fill(avustushakuName);
    await this.page.fill("#haku-name-sv", avustushakuName + " på svenska");

    await this.selectVaCodes(vaCodes);

    if (installment === Installment.MultipleInstallments) {
      await this.page.locator("text=Useampi maksuerä").click();
      await this.page.locator("text=Kaikille avustuksen saajille").click();
      await this.page
        .locator("select#transaction-account")
        .selectOption("5000");
    }

    const taTili = this.hauntiedotLocators().taTili;
    await taTili.tili(0).input.fill(talousarviotili.code);
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");
    await taTili.tili(0).koulutusaste(0).input.fill("Ammatillinen koulutus");
    await this.page.keyboard.press("ArrowDown");
    await this.page.keyboard.press("Enter");

    if (arvioituMaksupaiva) {
      await this.page.fill(
        '[name="arvioitu_maksupaiva"]',
        formatDate(arvioituMaksupaiva)
      );
    }

    if (jaossaOlevaSumma !== undefined) {
      await this.page.fill("#total-grant-size", String(jaossaOlevaSumma));
    }

    await this.selectTositelaji("XE");
    await this.page.fill("#hakuaika-start", formatDate(hakuaikaStart));
    await this.page.fill("#hakuaika-end", formatDate(hakuaikaEnd));
    await this.addValmistelija("Viivi Virkailija");
    await this.addArvioija("Päivi Pääkäyttäjä");

    for (var i = 0; i < selectionCriteria.length; i++) {
      await this.page.click('[data-test-id="add-selection-criteria"]');
      await this.page.fill(`#selection-criteria-${i}-fi`, selectionCriteria[i]);
      await this.page.fill(`#selection-criteria-${i}-sv`, selectionCriteria[i]);
    }

    for (var i = 0; i < raportointivelvoitteet.length; i++) {
      await this.selectRaportointilaji(
        i,
        raportointivelvoitteet[i].raportointilaji
      );
      await this.page.fill(
        `[name="maaraaika-${i}"]`,
        raportointivelvoitteet[i].maaraaika
      );
      await this.page.fill(
        `[id="asha-tunnus-${i}"]`,
        raportointivelvoitteet[i].ashaTunnus
      );
      if (raportointivelvoitteet[i].lisatiedot) {
        await this.page.fill(
          `[id="lisatiedot-${i}"]`,
          raportointivelvoitteet[i].lisatiedot ?? ""
        );
      }
      await this.waitForSave();
      await this.page.click(`[id="new-raportointivelvoite-${i}"]`);
    }

    for (const saadanto of lainsaadanto) {
      await this.page.locator(`label:has-text("${saadanto}")`).click();
      await this.waitForSave();
    }

    await this.switchToPaatosTab();
    await this.page.fill(
      '[data-test-id="hankkeen-alkamispaiva"] div.datepicker input',
      hankkeenAlkamispaiva
    );
    await this.page.fill(
      '[data-test-id="hankkeen-paattymispaiva"] div.datepicker input',
      hankkeenPaattymispaiva
    );
    await this.page.fill('[id="decision.taustaa.fi"]', "taustaa");

    await this.waitForSave();
    await this.switchToHaunTiedotTab();
  }

  async addValmistelija(name: string) {
    await this.searchUsersForRoles(name);
    await this.selectUser(name);
  }

  async addArvioija(name: string) {
    await this.searchUsersForRoles(name);
    await this.selectUser(name);
    await this.setUserRole(name, "evaluator");
  }

  async addVastuuvalmistelija(name: string) {
    await this.searchUsersForRoles(name);
    await this.selectUser(name);
    await this.setUserRole(name, "vastuuvalmistelija");
  }

  async createHakuWithLomakeJson(
    lomakeJson: string,
    hakuProps: HakuProps
  ): Promise<{ avustushakuID: number }> {
    const avustushakuID = await this.copyEsimerkkihaku();
    await this.fillAvustushaku(hakuProps);
    const formEditorPage = await this.navigateToFormEditor(avustushakuID);

    if (hakuProps.hakemusFields.length) {
      const newJson = addFieldsToHakemusJson(
        lomakeJson,
        hakuProps.hakemusFields
      );
      await formEditorPage.changeLomakeJson(newJson);
    } else {
      await formEditorPage.changeLomakeJson(lomakeJson);
    }

    await formEditorPage.saveForm();
    return { avustushakuID };
  }

  async publishAvustushaku() {
    await this.page.click("label[for='set-status-published']");
    await this.waitForSave();
  }

  async setAvustushakuInDraftState() {
    await this.page.click("label[for='set-status-draft']");
    await this.waitForSave();
  }

  async setStartDate(time: moment.Moment) {
    const selector = "#hakuaika-start";
    await this.page.fill(selector, formatDate(time));
    await this.page.$eval(selector, (e) => e.blur());
    await this.waitForSave();
  }

  async setEndDate(endTime: string) {
    const selector = "#hakuaika-end";
    await this.page.fill(selector, endTime);
    await this.page.$eval(selector, (e) => e.blur());
    await this.waitForSave();
  }

  async setAvustushakuEndDateToTomorrow() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = `${tomorrow.getDate()}.${
      tomorrow.getMonth() + 1
    }.${tomorrow.getFullYear()} ${tomorrow.getHours()}.${tomorrow.getMinutes()}`;
    await this.setEndDate(tomorrowString);
  }

  async closeAvustushakuByChangingEndDateToPast() {
    const previousYear = new Date().getFullYear() - 1;
    await this.setEndDate(`1.1.${previousYear} 0.00`);
  }

  async createMuutoshakemusEnabledHaku(hakuProps: HakuProps) {
    const avustushakuID = await this.createUnpublishedMuutoshakemusEnabledHaku(
      hakuProps
    );

    await this.publishAvustushaku();
    return avustushakuID;
  }

  async createUnpublishedMuutoshakemusEnabledHaku(hakuProps: HakuProps) {
    const muutoshakemusEnabledHakuLomakeJson = await fs.readFile(
      path.join(__dirname, "../fixtures/prod.hakulomake.json"),
      "utf8"
    );
    const { avustushakuID } = await this.createHakuWithLomakeJson(
      muutoshakemusEnabledHakuLomakeJson,
      hakuProps
    );
    await this.navigate(avustushakuID);
    return avustushakuID;
  }

  async createBudjettimuutosEnabledHaku(hakuProps: HakuProps) {
    const muutoshakemusEnabledHakuLomakeJson = await fs.readFile(
      path.join(__dirname, "../fixtures/budjettimuutos.hakulomake.json"),
      "utf8"
    );
    const { avustushakuID } = await this.createHakuWithLomakeJson(
      muutoshakemusEnabledHakuLomakeJson,
      hakuProps
    );
    await this.navigate(avustushakuID);
    await this.publishAvustushaku();
    return avustushakuID;
  }

  async allowExternalApi(allow: boolean) {
    await this.page.click(
      `label[for="allow_visibility_in_external_system_${allow}"]`
    );
    await this.waitForSave();
  }

  hakuListingTableSelectors() {
    const hakuList = this.page.locator("#haku-listing");
    const hakuRows = hakuList.locator("tbody tr");
    const baseTableLocators = (columnTestId: string) => ({
      cellValue: (trTestId: string) =>
        hakuList
          .locator(`[data-test-id="${trTestId}"]`)
          .locator(`[data-test-id=${columnTestId}]`),
      cellValues: () =>
        hakuRows.locator(`[data-test-id=${columnTestId}]`).allInnerTexts(),
      sort: this.page.locator(`[data-test-id=sort-button-${columnTestId}]`),
    });
    return {
      hakuList,
      hakuRows,
      avustushaku: {
        ...baseTableLocators("avustushaku"),
        input: this.page.locator('[placeholder="Avustushaku"]'),
      },
      tila: {
        ...baseTableLocators("status"),
        toggle: this.page.locator('button:has-text("Tila")'),
        uusiCheckbox: this.page.locator('label:has-text("Uusi")'),
      },
      vaihe: {
        ...baseTableLocators("phase"),
        toggle: this.page.locator('button:has-text("Vaihe")'),
        kiinniCheckbox: this.page.locator('label:has-text("Kiinni")'),
      },
      hakuaika: {
        ...baseTableLocators("hakuaika"),
        toggle: this.page.locator('button:has-text("Hakuaika")'),
        clear: this.page.locator('[aria-label="Tyhjennä hakuaika rajaukset"]'),
        hakuaikaStart: this.page.locator(
          '[aria-label="Rajaa avustushaut niihin joiden hakuaika alkaa päivämääränä tai sen jälkeen"] input'
        ),
        hakuaikaEnd: this.page.locator(
          '[aria-label="Rajaa avustushaut niihin joiden hakuaika päättyy päivämääränä tai sitä ennen"] input'
        ),
      },
      paatos: baseTableLocators("paatos"),
      valiselvitykset: baseTableLocators("valiselvitykset"),
      loppuselvitykset: baseTableLocators("loppuselvitykset"),
      vastuuvalmistelija: baseTableLocators("valmistelija"),
      muutoshakukelpoinen: baseTableLocators("muutoshakukelpoinen"),
      maksatukset: baseTableLocators("maksatukset"),
      kayttoaikaAlkaa: baseTableLocators("kayttoaikaAlkaa"),
      kayttoaikaPaattyy: baseTableLocators("kayttoaikaPaattyy"),
      jaossaOllutSumma: baseTableLocators("jaossaOllutSumma"),
      maksettuSumma: baseTableLocators("maksettuSumma"),
      budjetti: baseTableLocators("budjetti"),
    };
  }

  hauntiedotLocators() {
    return {
      hakuName: {
        fi: this.page.locator("#haku-name-fi"),
      },
      taTili: {
        tili: (index: number) => {
          const tiliLocator = this.page.locator(`#ta-tili-select-${index}`);
          const container = this.page.locator(`#ta-tili-container-${index}`);
          return {
            ...createReactSelectLocators(tiliLocator, "taTiliSelection"),
            koulutusaste: (index: number) => {
              const selectLocator = container.locator(
                `#koulutusaste-select-${index}`
              );
              return {
                ...createReactSelectLocators(
                  selectLocator,
                  "koulutusasteSelection"
                ),
                select: selectLocator,
                addKoulutusasteBtn: container.locator(
                  'button[title="Lisää uusi koulutusastevalinta"]'
                ),
                removeKoulutusasteBtn: (aste: string) =>
                  container.locator(
                    `button[title="Poista koulutusaste ${aste} talousarviotililtä"]`
                  ),
              };
            },
            addTiliBtn: container.locator(
              'button[title="Lisää talousarviotili"]'
            ),
            removeTiliBtn: container.locator(
              'button[title="Poista talousarviotili"]'
            ),
          };
        },
      },
    };
  }
}
