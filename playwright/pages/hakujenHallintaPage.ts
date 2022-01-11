import {expect, Page} from "@playwright/test";
import moment from "moment";
import fs from 'fs/promises'
import path from "path";

import {navigate} from "../utils/navigate";
import {
  clickElementWithText,
  expectQueryParameter,
  getElementWithText
} from "../utils/util";
import {VIRKAILIJA_URL} from "../utils/constants";
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

export interface HakuProps {
  avustushakuName: string
  registerNumber: string
  vaCodes: VaCodeValues
  hakuaikaStart: Date
  hakuaikaEnd: Date
  hankkeenAlkamispaiva: string
  hankkeenPaattymispaiva: string
}

const dateFormat = 'D.M.YYYY H.mm'
const formatDate = (date: Date) => moment(date).format(dateFormat)
export const parseDate = (input: string) => moment(input, dateFormat).toDate()

const waitForSaveStatusOk = (page: Page) => page.waitForSelector('[data-test-id="save-status"]:has-text("Kaikki tiedot tallennettu")')

export function FormEditorPage(page: Page) {

  const editorTextareaSelector = '.form-json-editor textarea'
  async function changeLomakeJson(lomakeJson: string) {
    /*
      for some reason
      await this.page.fill(".form-json-editor textarea", lomakeJson)
      takes almost 50seconds
     */
    await page.waitForSelector(editorTextareaSelector)
    await page.$eval(editorTextareaSelector, (textarea: HTMLTextAreaElement, lomakeJson) => {
      textarea.value = lomakeJson
    }, lomakeJson)

    // trigger autosave by typing space in the end
    await page.type('.form-json-editor textarea', ' ')
    await page.keyboard.press('Backspace')
  }

  async function saveForm() {
    await Promise.all([
      page.waitForSelector('[data-test-id="save-status"]:has-text("Tallennetaan")'),
      page.click("#saveForm:not(disabled)")
    ])
    await waitForSaveStatusOk(page)
  }

  return {
    changeLomakeJson,
    saveForm,
  }
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

  async navigateToFormEditor(avustushakuID: number) {
    await navigate(this.page, `/admin/form-editor/?avustushaku=${avustushakuID}`)
    return FormEditorPage(this.page)
  }

  async waitForSave() {
    await waitForSaveStatusOk(this.page)
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

  async setLoppuselvitysDate(value: string) {
    await this.page.fill('[data-test-id="loppuselvityksen-aikaraja"] div.datepicker input', value)
    await this.page.keyboard.press('Tab')
  }

  async setValiselvitysDate(value: string) {
    await this.page.fill('[data-test-id="valiselvityksen-aikaraja"] div.datepicker input', value)
    await this.page.keyboard.press('Tab')
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

  async copyEsimerkkihaku() {
    await navigate(this.page, "/admin/haku-editor/")
    await this.page.click(".haku-filter-remove")
    await clickElementWithText(this.page, "td", "Yleisavustus - esimerkkihaku")
    const element = await getElementWithText(this.page, "td", "Yleisavustus - esimerkkihaku")
    const currentHakuTitle = await (await element.getProperty('textContent'))?.jsonValue() as string
    await clickElementWithText(this.page, "a", "Kopioi uuden pohjaksi")

    await this.page.waitForFunction((name) =>
      document.querySelector("#haku-name-fi")?.textContent !== name, currentHakuTitle)
    await this.waitForSave()
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

  async createHakuFromEsimerkkihaku(props: HakuProps): Promise<number> {
    const {
      avustushakuName,
      registerNumber,
      hakuaikaStart,
      hakuaikaEnd,
      hankkeenAlkamispaiva,
      hankkeenPaattymispaiva
    } = props
    console.log(`Avustushaku name for test: ${avustushakuName}`)

    await this.copyEsimerkkihaku()

    const avustushakuID = parseInt(await expectQueryParameter(this.page, "avustushaku"))
    console.log(`Avustushaku ID: ${avustushakuID}`)

    await this.page.fill("#register-number", registerNumber)
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
    await this.page.fill("#hakuaika-start", formatDate(hakuaikaStart))
    await this.page.fill("#hakuaika-end", formatDate(hakuaikaEnd))

    await this.page.click('[data-test-id="päätös-välilehti"]')
    await this.page.fill('[data-test-id="hankkeen-alkamispaiva"] div.datepicker input', hankkeenAlkamispaiva)
    await this.page.fill('[data-test-id="hankkeen-paattymispaiva"] div.datepicker input', hankkeenPaattymispaiva)
    await clickElementWithText(this.page, "span", "Haun tiedot")

    await this.waitForSave()

    return avustushakuID
  }

  async createHakuWithLomakeJson(lomakeJson: string, hakuProps: HakuProps): Promise<{ avustushakuID: number }> {
    const avustushakuID = await this.createHakuFromEsimerkkihaku(hakuProps)
    const formEditorPage = await this.navigateToFormEditor(avustushakuID)
    await formEditorPage.changeLomakeJson(lomakeJson)
    await formEditorPage.saveForm()
    return { avustushakuID }
  }

  async publishAvustushaku() {
    await this.page.click("label[for='set-status-published']")
    await this.waitForSave()
  }

  async setEndDate(endTime: string) {
    const selector = "#hakuaika-end"
    await this.page.fill(selector, endTime)
    await this.page.$eval(selector, (e => e.blur()))
    await this.waitForSave()
  }

  async setAvustushakuEndDateToTomorrow() {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowString = `${tomorrow.getDate()}.${tomorrow.getMonth()+1}.${tomorrow.getFullYear()} ${tomorrow.getHours()}.${tomorrow.getMinutes()}`
    await this.setEndDate(tomorrowString)
  }

  async closeAvustushakuByChangingEndDateToPast() {
    const previousYear = (new Date()).getFullYear() - 1
    await this.setEndDate(`1.1.${previousYear} 0.00`)
  }

  async createMuutoshakemusEnabledHaku(hakuProps: HakuProps) {
    const muutoshakemusEnabledHakuLomakeJson = await fs.readFile(path.join(__dirname, '../fixtures/prod.hakulomake.json'), 'utf8')
    const {avustushakuID} = await this.createHakuWithLomakeJson(muutoshakemusEnabledHakuLomakeJson, hakuProps)
    await clickElementWithText(this.page, "span", "Haun tiedot")
    await this.publishAvustushaku()
    return avustushakuID
  }

  async createBudjettimuutosEnabledHaku(hakuProps: HakuProps) {
    const muutoshakemusEnabledHakuLomakeJson = await fs.readFile(path.join(__dirname, '../fixtures/budjettimuutos.hakulomake.json'), 'utf8')
    const {avustushakuID} = await this.createHakuWithLomakeJson(muutoshakemusEnabledHakuLomakeJson, hakuProps)
    await clickElementWithText(this.page, "span", "Haun tiedot")
    await this.publishAvustushaku()
    return avustushakuID
  }

}
