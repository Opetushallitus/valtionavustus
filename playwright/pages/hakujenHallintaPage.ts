import {Page} from "playwright";
import {navigate} from "../utils/navigate";
import {
  clickElementWithText,
  expectQueryParameter,
  getElementWithText
} from "../utils/util";
import {mkAvustushakuName} from "../utils/random";
import fs from 'fs/promises'
import path from "path";
import {VIRKAILIJA_URL} from "../utils/constants";
import {expect} from "@playwright/test";
import {VaCodeValues} from "../utils/types";

interface Rahoitusalue {
  koulutusaste: string
  talousarviotili: string
}

const defaultRahoitusalueet: Rahoitusalue[] = [
  {
    koulutusaste: "Ammatillinen koulutus",
    talousarviotili: "29.10.30.20"
  }
]

interface HakuProps {
  name?: string
  registerNumber: string
  hakuaikaStart?: string
  hakuaikaEnd?: string
  hankkeenAlkamispaiva?: string
  hankkeenPaattymispaiva?: string
  vaCodes?: VaCodeValues
}

export class HakujenHallintaPage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(avustushakuID: number) {
    await navigate(this.page, `/admin/haku-editor/?avustushaku=${avustushakuID}`)
  }

  async navigateToPaatos(avustushakuID: number) {
    await navigate(this.page, `/admin/decision/?avustushaku=${avustushakuID}`)
  }

  async waitForSave() {
    await this.page.waitForSelector('#form-controls .status .info:has-text("Kaikki tiedot tallennettu")')
  }

  async searchUsers(user: string) {
    await Promise.all([
      this.page.waitForResponse(`${VIRKAILIJA_URL}/api/va-user/search`),
      this.page.fill('#va-user-search-input', user)
    ])
  }

  async selectUser(user: string, avustushakuID: number) {
    await Promise.all([
      this.page.waitForResponse(`${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/role`),
      clickElementWithText(this.page, 'a', user)
    ])
  }

  async removeUser(avustushakuID: number, role = '_-valtionavustus') {
    await Promise.all([
      this.page.waitForResponse(
        response => {
          const regex = new RegExp(`.*api/avustushaku/${avustushakuID}/role/*`, "g")
          const matchResult = response.url().match(regex)
          return !!matchResult && matchResult.length > 0
        }),
      this.page.click( `[data-test-id="remove-role-${role}"]`)
    ])
  }

  async sendPaatos(avustushakuID: number) {
    await clickElementWithText(this.page, "button", "Lähetä 1 päätöstä")
    await Promise.all([
      this.page.waitForResponse(`${VIRKAILIJA_URL}/api/paatos/sendall/${avustushakuID}`),
      clickElementWithText(this.page, "button", "Vahvista lähetys"),
    ])
    const tapahtumaloki = await this.page.waitForSelector(".tapahtumaloki")
    const logEntryCount = await tapahtumaloki.evaluate(e => e.querySelectorAll(".entry").length)
    expect(logEntryCount).toEqual(1)
  }

  async resolveAvustushaku() {
    await this.page.click("label[for='set-status-resolved']")
    await this.waitForSave()
  }

  async waitForSaveStatusOk() {
    await this.page.waitForSelector('[data-test-id="save-status"]:has-text("Kaikki tiedot tallennettu")')
  }

  async copyEsimerkkihaku() {
    await navigate(this.page, "/admin/haku-editor/")
    await this.page.click(".haku-filter-remove")
    await clickElementWithText(this.page, "td", "Yleisavustus - esimerkkihaku")
    const element = await getElementWithText(this.page, "td", "Yleisavustus - esimerkkihaku")
    const currentHakuTitle = await (await element.getProperty('textContent'))?.jsonValue() as string
    await clickElementWithText(this.page, "a", "Kopioi uuden pohjaksi")

    await this.page.waitForFunction((name) =>
      document.querySelector("#haku-name-fi")?.textContent !== name, currentHakuTitle)
    await this.waitForSaveStatusOk()
    // await this.page.waitForTimeout(2000)
  }

  async inputTalousarviotili({koulutusaste, talousarviotili}: Rahoitusalue) {
    await this.page.fill(`input[name="education-levels"][data-title="${koulutusaste}"]`, talousarviotili)
  }

  async selectCode(codeType: 'operational-unit' | 'project' | 'operation', code: string): Promise<void> {
    await this.page.click(`[data-test-id=code-value-dropdown__${codeType}] > div`)
    await this.page.click(`[data-test-id='${code}']`)
  }

  async selectTositelaji(value: 'XE' | 'XB'): Promise<void> {
    await this.page.selectOption('select#document-type', value)
  }

  randomInt(min: number, max: number): number {
    return min + Math.ceil(Math.random() * (max - min))
  }

  randomAsiatunnus(): string {
    return `${this.randomInt(1,99999)}/${this.randomInt(10,999999)}`
  }

  async createHakuFromEsimerkkihaku(props: HakuProps): Promise<number> {
    const {
      name,
      registerNumber,
      hakuaikaStart,
      hakuaikaEnd,
      hankkeenAlkamispaiva,
      hankkeenPaattymispaiva
    } = props
    const avustushakuName = name || mkAvustushakuName()
    console.log(`Avustushaku name for test: ${avustushakuName}`)

    await this.copyEsimerkkihaku()

    const avustushakuID = parseInt(await expectQueryParameter(this.page, "avustushaku"))
    console.log(`Avustushaku ID: ${avustushakuID}`)

    await this.page.fill("#register-number", registerNumber || this.randomAsiatunnus())
    await this.page.fill("#haku-name-fi", avustushakuName)
    await this.page.fill("#haku-name-sv", avustushakuName + ' på svenska')

    if (props.vaCodes) {
      await this.selectCode('operational-unit', props.vaCodes.operationalUnit)
      await this.selectCode('project', props.vaCodes.project)
      await this.selectCode('operation', props.vaCodes.operation)
    }

    for (const rahoitusalue of defaultRahoitusalueet) {
      await this.inputTalousarviotili(rahoitusalue)
    }

    await this.selectTositelaji('XE')
    await this.page.fill("#hakuaika-start", hakuaikaStart || "1.1.1970 0.00")
    const nextYear = (new Date()).getFullYear() + 1
    await this.page.fill("#hakuaika-end", hakuaikaEnd || `31.12.${nextYear} 23.59`)

    await this.page.click('[data-test-id="päätös-välilehti"]')
    await this.page.fill('[data-test-id="hankkeen-alkamispaiva"] div.datepicker input', hankkeenAlkamispaiva || '20.04.1969')
    await this.page.fill('[data-test-id="hankkeen-paattymispaiva"] div.datepicker input', hankkeenPaattymispaiva || '20.04.4200')
    await clickElementWithText(this.page, "span", "Haun tiedot")

    await this.waitForSave()

    return avustushakuID
  }

  async clickFormSaveAndWait() {
    await Promise.all([
      this.page.waitForSelector('[data-test-id="save-status"]:has-text("Tallennetaan")'),
      this.page.click("#saveForm:not(disabled)")
    ])
    await this.waitForSaveStatusOk()
  }

  async createHakuWithLomakeJson(lomakeJson: string, registerNumber: string, hakuName?: string, codes?: VaCodeValues): Promise<{ avustushakuID: number }> {
    const avustushakuID = await this.createHakuFromEsimerkkihaku({
      registerNumber,
      name: hakuName,
      vaCodes: codes
    })
    await clickElementWithText(this.page, "span", "Hakulomake")
    /*
      for some reason
      await this.page.fill(".form-json-editor textarea", lomakeJson)
      takes almost 50seconds
     */
    const changeLomakeWithJson = async () => {
      await this.page.evaluate((text) => {
        const textArea = document.querySelector<HTMLTextAreaElement>('.form-json-editor textarea')
        if (!textArea) {
          throw Error('textarea not found')
        }
        textArea.value = text
      }, lomakeJson)
      // trigger autosave by typing space in the end
      await this.page.type('.form-json-editor textarea', ' ')
      await this.page.keyboard.press('Backspace')
    }
    await changeLomakeWithJson()
    await this.clickFormSaveAndWait()
    return { avustushakuID }
  }

  async publishAvustushaku() {
    await this.page.click("label[for='set-status-published']")
    await this.waitForSave()
  }

  async closeAvustushakuByChangingEndDateToPast() {
    const previousYear = (new Date()).getFullYear() - 1
    const selector = "#hakuaika-end"
    await this.page.fill(selector, `1.1.${previousYear} 0.00`, {})
    await this.page.$eval(selector, (e => e.blur()))
    await this.waitForSave()
  }

  async createMuutoshakemusEnabledHaku(registerNumber: string, hakuName?: string, codes?: VaCodeValues) {
    const muutoshakemusEnabledHakuLomakeJson = await fs.readFile(path.join(__dirname, '../fixtures/prod.hakulomake.json'), 'utf8')
    const {avustushakuID} = await this.createHakuWithLomakeJson(muutoshakemusEnabledHakuLomakeJson, registerNumber, hakuName, codes)
    await clickElementWithText(this.page, "span", "Haun tiedot")
    await this.publishAvustushaku()
    return avustushakuID
  }

  async createBudjettimuutosEnabledHaku(registerNumber: string, hakuName?: string, codes?: VaCodeValues) {
    const muutoshakemusEnabledHakuLomakeJson = await fs.readFile(path.join(__dirname, '../fixtures/budjettimuutos.hakulomake.json'), 'utf8')
    const {avustushakuID} = await this.createHakuWithLomakeJson(muutoshakemusEnabledHakuLomakeJson, registerNumber, hakuName, codes)
    await clickElementWithText(this.page, "span", "Haun tiedot")
    await this.publishAvustushaku()
    return avustushakuID
  }

}
