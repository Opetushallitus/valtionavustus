import {Dialog, expect, Page} from "@playwright/test";
import moment from "moment";
import fs from 'fs/promises'
import path from "path";

import {navigate} from "../utils/navigate";
import {
  clickElementWithText,
  clickElementWithTextStrict,
  expectQueryParameter
} from "../utils/util";
import {VIRKAILIJA_URL} from "../utils/constants";
import {VaCodeValues} from "../utils/types";
import {Response} from "playwright-core";

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
const formatDate = (date: Date | moment.Moment) => moment(date).format(dateFormat)
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

    await waitForFormErrorStateToDisappear()
    // trigger autosave by typing space in the end
    await page.type('.form-json-editor textarea', ' ')
    await page.keyboard.press('Backspace')
  }

  async function waitForFormErrorStateToDisappear() {
    await page.waitForSelector('[data-test-id="form-error-state"]', { state: 'hidden' })
  }

  async function saveForm() {
    await Promise.all([
      page.waitForSelector('[data-test-id="save-status"]:has-text("Tallennetaan")'),
      page.click("#saveForm:not(disabled)")
    ])
    await waitForSaveStatusOk(page)
  }

  async function getFieldIds() {
    const ids = await page.$$eval('span.soresu-field-id', elems => elems.map(e => e.textContent))
    return ids.filter(id => id !== null) as string[]
  }

  async function addField(afterFieldId: string, newFieldType: string) {
    await page.hover(`[data-test-id="field-add-${afterFieldId}"]`)
    await page.click(`[data-test-id="field-${afterFieldId}"] [data-test-id="add-field-${newFieldType}"]`)
    await page.hover('span.soresu-field-id:first-of-type') // hover on something else so that the added content from first hover doesn't change page coordinates
  }

  async function acceptDialog(dialog: Dialog) {
    await dialog.accept()
  }

  async function removeField(fieldId: string) {
    page.on('dialog', acceptDialog)
    await page.click(`[data-test-id="delete-field-${fieldId}"]`)
    await page.waitForFunction(fieldId => {
      const fieldIds = Array.from(document.querySelectorAll('span.soresu-field-id')).map(e => e.textContent)
      return !fieldIds.includes(fieldId)
    }, fieldId)
    page.removeListener('dialog', acceptDialog)
  }

  async function moveField(fieldId: string, direction: 'up' | 'down') {
    const fields = await getFieldIds()
    const originalIndex = fields.indexOf(fieldId)
    const expectedIndex = direction === 'up' ? originalIndex - 1 : originalIndex + 1
    await page.click(`[data-test-id="move-field-${direction}-${fieldId}"]`)
    await page.waitForFunction(({ fieldId, expectedIndex }) => {
      const fieldIds = Array.from(document.querySelectorAll('span.soresu-field-id')).map(e => e.textContent)
      return fieldIds[expectedIndex] === fieldId
    }, { expectedIndex, fieldId })
  }

  return {
    changeLomakeJson,
    saveForm,
    getFieldIds,
    addField,
    removeField,
    moveField,
  }
}

function SelvitysTab(page: Page) {
  const titleSelector = '[name="applicant-info-label-fi"]'

  async function save() {
    await Promise.all([
      page.click('text="Tallenna"'),
      page.waitForResponse(response => response.status() === 200 && isSelvitysSavedResponse(response))
    ])
  }

  function isSelvitysSavedResponse(response: Response) {
    if (response.request().method() !== 'POST') return false
    return response.url().endsWith('/selvitysform/valiselvitys') || response.url().endsWith('/selvitysform/loppuselvitys')
  }

  async function setSelvitysTitleFi(title: string) {
    await page.fill(titleSelector, title)
    await save()
  }

  async function getSelvitysTitleFi() {
    return await page.textContent(titleSelector)
  }

  return {
    getSelvitysTitleFi,
    setSelvitysTitleFi,
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
    await this.page.waitForLoadState('networkidle')
    return FormEditorPage(this.page)
  }

  async switchToHaunTiedotTab() {
    await this.page.click('[data-test-id="haun-tiedot-välilehti"]')
    await this.page.waitForSelector('#register-number')
  }

  async switchToPaatosTab() {
    await this.page.click('[data-test-id="päätös-välilehti"]')
  }

  async switchToValiselvitysTab() {
    await this.page.click('[data-test-id="väliselvitys-välilehti"]')
    return SelvitysTab(this.page)
  }

  async switchToLoppuselvitysTab() {
    await this.page.click('[data-test-id="loppuselvitys-välilehti"]')
    return SelvitysTab(this.page)
  }

  async sendValiselvitys() {
    await this.page.click('text="Lähetä väliselvityspyynnöt"')
  }

  async sendLoppuselvitys() {
    await this.page.click('text="Lähetä loppuselvityspyynnöt"')
    await this.page.waitForSelector('text="Lähetetty 1 viestiä"')
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

  async selectUser(user: string) {
    await Promise.all([
      this.waitForRolesSaved(),
      clickElementWithText(this.page, 'a', user)
    ])
  }

  async removeUser(name: string) {
    const testId = "role-" +name.toLowerCase().replace(" ", "-")
    await Promise.all([
      this.waitForRolesSaved(),
      this.page.click(`[data-test-id="${testId}"] button.remove`)
    ])
  }

  async setUserRole(name: string, role: 'presenting_officer' | 'evaluator') {
    const testId = "role-" +name.toLowerCase().replace(" ", "-")
    await Promise.all([
      this.waitForRolesSaved(),
      this.page.selectOption(`[data-test-id="${testId}"] select[name=role]`, role)
        .then(_ => this.page.keyboard.press('Tab')) // tab out of the field to trigger save
    ])
  }

  async waitForRolesSaved() {
    return await this.page.waitForResponse(new RegExp(
      `${VIRKAILIJA_URL}/api/avustushaku/\\d+/role(/\\d+)?`
    ))
  }

  async setLoppuselvitysDate(value: string) {
    await this.page.fill('[data-test-id="loppuselvityksen-aikaraja"] div.datepicker input', value)
    await this.page.keyboard.press('Tab')
  }

  async setValiselvitysDate(value: string) {
    await this.page.fill('[data-test-id="valiselvityksen-aikaraja"] div.datepicker input', value)
    await this.page.keyboard.press('Tab')
  }

  async sendPaatos(avustushakuID: number, amount = 1) {
    await this.page.click(`text="Lähetä ${amount} päätöstä"`)
    await Promise.all([
      this.page.waitForResponse(`${VIRKAILIJA_URL}/api/paatos/sendall/${avustushakuID}`),
      clickElementWithText(this.page, "button", "Vahvista lähetys"),
    ])
    const tapahtumaloki = await this.page.waitForSelector(".tapahtumaloki")
    const logEntryCount = await tapahtumaloki.evaluate(e => e.querySelectorAll(".entry").length)
    expect(logEntryCount).toEqual(1)
  }

  async resendPaatokset(amountToSend = 1) {
    await this.page.click(`text="Lähetä ${amountToSend} päätöstä uudelleen"`)
    await this.page.click('text="Vahvista päätösten uudelleenlähetys"')
    await this.page.waitForSelector('text="Päätökset lähetetty uudelleen"')
  }

  async resolveAvustushaku() {
    await this.page.click("label[for='set-status-resolved']")
    await this.waitForSave()
  }

  async copyCurrentHaku(): Promise<number> {
    const currentHakuTitle = await this.page.$eval<string | null, HTMLTextAreaElement>("#haku-name-fi", el => el.textContent)
    await clickElementWithText(this.page, "a", "Kopioi uuden pohjaksi")

    await this.page.waitForFunction((name) =>
      document.querySelector("#haku-name-fi")?.textContent !== name, currentHakuTitle)
    await this.waitForSave()

    return parseInt(await expectQueryParameter(this.page, "avustushaku"))
  }

  async copyEsimerkkihaku(): Promise<number> {
    await navigate(this.page, "/admin/haku-editor/")
    await clickElementWithTextStrict(this.page, "td", "Yleisavustus - esimerkkihaku")
    return await this.copyCurrentHaku()
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

    const avustushakuID = await this.copyEsimerkkihaku()
    await this.page.waitForLoadState('networkidle')
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
    await this.addValmistelija("Viivi Virkailija")
    await this.addArvioija("Päivi Pääkäyttäjä")

    await this.page.click('[data-test-id="päätös-välilehti"]')
    await this.page.fill('[data-test-id="hankkeen-alkamispaiva"] div.datepicker input', hankkeenAlkamispaiva)
    await this.page.fill('[data-test-id="hankkeen-paattymispaiva"] div.datepicker input', hankkeenPaattymispaiva)
    await clickElementWithText(this.page, "span", "Haun tiedot")

    await this.waitForSave()

    return avustushakuID
  }

  async addValmistelija(name: string) {
    await this.searchUsers(name)
    await this.selectUser(name)
  }

  async addArvioija(name: string) {
    await this.searchUsers(name)
    await this.selectUser(name)
    await this.setUserRole(name, 'evaluator')
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

  async setStartDate(time: moment.Moment) {
    const selector = "#hakuaika-start"
    await this.page.fill(selector, formatDate(time))
    await this.page.$eval(selector, (e => e.blur()))
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
