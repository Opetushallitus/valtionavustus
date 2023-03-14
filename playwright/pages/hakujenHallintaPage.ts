import { expect, Locator, Page } from '@playwright/test'
import { Response } from 'playwright-core'
import moment from 'moment'
import fs from 'fs/promises'
import path from 'path'

import { navigate } from '../utils/navigate'
import { clickElementWithText, expectQueryParameter } from '../utils/util'
import { VIRKAILIJA_URL } from '../utils/constants'
import { VaCodeValues, Field, NoProjectCodeProvided } from '../utils/types'
import { addFieldsToHakemusJson } from '../utils/hakemus-json'
import { Talousarviotili } from '../../va-virkailija/web/va/koodienhallinta/types'
import { createReactSelectLocators } from '../utils/react-select'
import { HakulomakePage } from './hakujen-hallinta/HakulomakePage'
import { PaatosPage } from './hakujen-hallinta/PaatosPage'
import { saveStatusTestId, waitForSave } from './hakujen-hallinta/common'

interface Raportointivelvoite {
  raportointilaji: string
  maaraaika: string
  ashaTunnus: string
  lisatiedot?: string
}

export interface HakuProps {
  avustushakuName: string
  randomName: string
  registerNumber: string
  vaCodes: VaCodeValues
  hakuaikaStart: Date
  hakuaikaEnd: Date
  arvioituMaksupaiva?: Date
  lainsaadanto: string[]
  hankkeenAlkamispaiva: string
  hankkeenPaattymispaiva: string
  selectionCriteria: string[]
  raportointivelvoitteet: Raportointivelvoite[]
  hakemusFields: Field[]
  jaossaOlevaSumma?: number
  installment?: Installment
  talousarviotili: Omit<Talousarviotili, 'id' | 'migrated-from-not-normalized-ta-tili' | 'deleted'>
}

export enum Installment {
  OneInstallment,
  MultipleInstallments,
}

const dateFormat = 'D.M.YYYY H.mm'
const formatDate = (date: Date | moment.Moment) => moment(date).format(dateFormat)
export const parseDate = (input: string) => moment(input, dateFormat).toDate()

function SelvitysTab(page: Page) {
  const titleSelector = '[name="applicant-info-label-fi"]'

  async function save() {
    await Promise.all([
      page.click('text="Tallenna"'),
      page.waitForResponse(
        (response) => response.status() === 200 && isSelvitysSavedResponse(response)
      ),
    ])
  }

  function isSelvitysSavedResponse(response: Response) {
    if (response.request().method() !== 'POST') return false
    return (
      response.url().endsWith('/selvitysform/valiselvitys') ||
      response.url().endsWith('/selvitysform/loppuselvitys')
    )
  }

  async function setSelvitysTitleFi(title: string) {
    await page.fill(titleSelector, title)
    await save()
  }

  async function getSelvitysTitleFi() {
    return await page.textContent(titleSelector)
  }

  async function openFormPreview(testId: string) {
    const [previewPage] = await Promise.all([
      page.context().waitForEvent('page'),
      await page.getByTestId(testId).click(),
    ])
    await previewPage.bringToFront()
    return previewPage
  }

  async function openFormPreviewFi() {
    return await openFormPreview('form-preview-fi')
  }

  async function openFormPreviewSv() {
    return await openFormPreview('form-preview-sv')
  }

  return {
    getSelvitysTitleFi,
    setSelvitysTitleFi,
    openFormPreviewFi,
    openFormPreviewSv,
  }
}

export class HakujenHallintaPage {
  readonly page: Page
  readonly valiselvitysUpdatedAt: Locator
  readonly loppuselvitysUpdatedAt: Locator
  readonly decisionEditor: Locator
  readonly loadingAvustushaku: Locator

  constructor(page: Page) {
    this.page = page
    this.valiselvitysUpdatedAt = this.page.locator('#valiselvitysUpdatedAt')
    this.loppuselvitysUpdatedAt = this.page.locator('#loppuselvitysUpdatedAt')
    this.decisionEditor = this.page.locator('.decision-editor')
    this.loadingAvustushaku = this.page
      .getByTestId(saveStatusTestId)
      .locator('text=Ladataan tietoja')
  }

  async navigateFromHeader() {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'networkidle' }),
      this.page.locator(`text="Hakujen hallinta"`).click(),
    ])
  }

  async navigateTo(path: string) {
    await navigate(this.page, path, true)
  }

  async navigate(avustushakuID: number) {
    await this.navigateTo(`/admin/haku-editor/?avustushaku=${avustushakuID}`)
  }

  async navigateToDefaultAvustushaku() {
    await this.navigateTo('/admin/haku-editor/')
  }

  async navigateToHakemusByClicking(avustushakuName: string) {
    await this.navigate(1)
    const { avustushaku } = this.hakuListingTableSelectors()
    await avustushaku.input.fill(avustushakuName)
    const listItemSelector = await this.page.getByTestId(avustushakuName)
    await expect(this.loadingAvustushaku).toBeHidden()
    await Promise.all([
      this.page.waitForNavigation(),
      expect(this.loadingAvustushaku).toBeVisible(),
      listItemSelector.click(),
    ])
    await expect(this.loadingAvustushaku).toBeHidden()
  }

  async navigateToValiselvitys(avustushakuID: number) {
    await this.navigateTo(`/admin/valiselvitys/?avustushaku=${avustushakuID}`)
  }

  async navigateToLoppuselvitys(avustushakuID: number) {
    await this.navigateTo(`/admin/loppuselvitys/?avustushaku=${avustushakuID}`)
  }

  async navigateToFormEditor(avustushakuID: number) {
    await this.navigateTo(`/admin/form-editor/?avustushaku=${avustushakuID}`)
    const formEditorPage = HakulomakePage(this.page)
    await formEditorPage.waitFormToBeLoaded()
    return formEditorPage
  }

  async switchToFormEditorTab() {
    await this.page.getByTestId('hakulomake-välilehti').click()
    const formEditorPage = HakulomakePage(this.page)
    await formEditorPage.waitFormToBeLoaded()
    return formEditorPage
  }

  async switchToHaunTiedotTab() {
    await this.page.getByTestId('haun-tiedot-välilehti').click()
    await expect(this.page.locator('#register-number')).toBeVisible()
  }

  async switchToPaatosTab() {
    await this.page.getByTestId('päätös-välilehti').click()
    return PaatosPage(this.page)
  }

  async switchToValiselvitysTab() {
    await this.page.getByTestId('väliselvitys-välilehti').click()
    return SelvitysTab(this.page)
  }

  async switchToLoppuselvitysTab() {
    await this.page.getByTestId('loppuselvitys-välilehti').click()
    return SelvitysTab(this.page)
  }

  async sendValiselvitys(expectedAmount = 1) {
    await this.page.click('text="Lähetä väliselvityspyynnöt"')
    await this.page.waitForSelector(`text="Lähetetty ${expectedAmount} viestiä"`)
  }

  async sendLoppuselvitys(expectedAmount = 1) {
    await this.page.click('text="Lähetä loppuselvityspyynnöt"')
    await this.page.waitForSelector(`text="Lähetetty ${expectedAmount} viestiä"`)
  }

  async waitForSave() {
    await waitForSave(this.page)
  }

  async searchUsersForRoles(user: string) {
    await Promise.all([
      this.page.waitForResponse(`${VIRKAILIJA_URL}/api/va-user/search`),
      this.page.fill('#va-user-search-input', user),
    ])
  }

  async searchUsersForVastuuvalmistelija(user: string) {
    await Promise.all([
      this.page.waitForResponse(`${VIRKAILIJA_URL}/api/va-user/search`),
      this.page.fill('#va-user-search-vastuuvalmistelija', user),
    ])
  }

  async clearUserSearchForRoles() {
    await this.page.getByTestId('clear-role-search').click()
  }

  async clearUserSearchForVastuuvalmistelija() {
    await this.page.getByTestId('clear-vastuuvalmistelija-search').click()
  }

  async fillVastuuvalmistelijaName(name: string) {
    await Promise.all([
      this.waitForRolesSaved(),
      this.page.getByTestId('vastuuvalmistelija-name').fill(name),
    ])
  }

  async fillVastuuvalmistelijaEmail(email: string) {
    await Promise.all([
      this.waitForRolesSaved(),
      this.page.getByTestId('vastuuvalmistelija-email').fill(email),
    ])
  }

  async selectUser(user: string) {
    await Promise.all([this.waitForRolesSaved(), clickElementWithText(this.page, 'a', user)])
  }

  async removeUser(name: string) {
    const testId = 'role-' + name.toLowerCase().replace(' ', '-')
    await Promise.all([
      this.waitForRolesSaved(),
      this.page.click(`[data-test-id="${testId}"] button.remove`),
    ])
  }

  async setUserRole(name: string, role: 'presenting_officer' | 'evaluator' | 'vastuuvalmistelija') {
    const testId = 'role-' + name.toLowerCase().replace(' ', '-')
    await Promise.all([
      this.waitForRolesSaved(),
      this.page
        .selectOption(`[data-test-id="${testId}"] select[name=role]`, role)
        .then((_) => this.page.keyboard.press('Tab')), // tab out of the field to trigger save
    ])
  }

  async waitForRolesSaved() {
    return await Promise.all([
      this.page.waitForResponse(new RegExp(`${VIRKAILIJA_URL}/api/avustushaku/\\d+/role(/\\d+)?`)),
      this.page.waitForResponse(new RegExp(`${VIRKAILIJA_URL}/api/avustushaku/\\d+/privileges`)),
    ])
  }

  async resolveAvustushaku() {
    await this.page.click("label[for='set-status-resolved']")
    await this.waitForSave()
  }

  async copyCurrentHaku(): Promise<number> {
    const waitForHakuCopyToBeCompleted = async (currentURL: string): Promise<void> => {
      await this.page.waitForFunction((url) => window.location.href !== url, currentURL)
      await this.page.waitForLoadState('networkidle')
      await expect(hakuNameFi).toHaveText(`${currentHakuTitle} (kopio)`)
      await expect(hakuNameFi).toBeEnabled()
    }

    const hakuNameFi = this.hauntiedotLocators().hakuName.fi
    const currentHakuTitle = await hakuNameFi.textContent()
    const currentURL = this.page.url()

    await Promise.all([
      waitForHakuCopyToBeCompleted(currentURL),
      this.page.locator('a', { hasText: 'Kopioi uuden pohjaksi' }).click(),
    ])
    await expect(hakuNameFi).toBeEnabled()
    const avustushakuID = parseInt(await expectQueryParameter(this.page, 'avustushaku'))
    console.log(`Avustushaku ID: ${avustushakuID}`)
    return avustushakuID
  }

  async copyEsimerkkihaku(): Promise<number> {
    await this.navigate(2)
    return await this.copyCurrentHaku()
  }

  dropdownSelector(codeType: 'operational-unit' | 'project' | 'operation') {
    return `[data-test-id=code-value-dropdown__${codeType}]`
  }

  async overrideProject(code: string, codeToOverride: string) {
    await this.page.click(`[data-test-id="projekti-valitsin-${codeToOverride}"] input`)
    await this.page.getByTestId(code).click()
  }

  async selectProject(code: string) {
    if (!code) throw new Error('No project code provided, cannot continue')

    await this.page.click(`.projekti-valitsin input`)
    await this.page.type(`.projekti-valitsin input`, code)
    await this.page.getByTestId(code).click()
  }

  async selectVaCodes(codes: VaCodeValues | undefined) {
    if (!codes) throw new Error('No VaCodeValues provided, cannot continue')

    await this.selectCode('operational-unit', codes.operationalUnit)

    for (const projectCode of codes.project) {
      if (projectCode !== NoProjectCodeProvided.code) {
        await this.addProjectRow()
        await this.overrideProject(projectCode, NoProjectCodeProvided.code)
      }
    }

    await this.selectCode('operation', codes.operation)
  }

  async selectVaCodesAndWaitForSave(codes: VaCodeValues | undefined) {
    const longTimeoutAsSelectingCodesMightTakeAWhile = 10000
    await Promise.all([
      this.selectVaCodes(codes),
      expect(this.page.getByTestId(saveStatusTestId).locator('text=Tallennetaan')).toBeVisible(),
      expect(
        this.page.getByTestId(saveStatusTestId).locator('text=Kaikki tiedot tallennettu')
      ).toBeVisible({ timeout: longTimeoutAsSelectingCodesMightTakeAWhile }),
    ])
  }

  async addProjectRow() {
    await this.page.click(`.lisaa-projekti`)
  }

  async removeProjectRow(projectToRemove: string) {
    await this.page.click(`[data-test-id="projekti-valitsin-${projectToRemove}"] .poista-projekti`)
  }

  async selectCode(
    codeType: 'operational-unit' | 'project' | 'operation',
    code: string
  ): Promise<void> {
    await this.page.click(`${this.dropdownSelector(codeType)} > div`)
    await this.page.getByTestId(code).click()
  }

  raportointilajiSelector(index: number) {
    return `[id="raportointilaji-dropdown-${index}"]`
  }

  async selectRaportointilaji(index: number, raportointilaji: string): Promise<void> {
    await this.page.click(`${this.raportointilajiSelector(index)} > div`)
    await this.page.getByTestId(raportointilaji).click()
  }

  async fillCode(
    codeType: 'operational-unit' | 'project' | 'operation',
    code: string
  ): Promise<void> {
    await this.page.fill(`${this.dropdownSelector(codeType)} > div input`, `${code}`)
  }

  async getInputOptionCodeStyles(code: string): Promise<CSSStyleDeclaration> {
    const selectableOptionElement = await this.page.waitForSelector(`[data-test-id="${code}"]`)
    return await this.page.evaluate((e) => getComputedStyle(e), selectableOptionElement)
  }

  async getInputPlaceholderCodeStyles(
    codeType: 'operational-unit' | 'project' | 'operation'
  ): Promise<CSSStyleDeclaration> {
    const selectableOptionElement = await this.page.waitForSelector(
      `[data-test-id="singlevalue-${codeType}"]`
    )
    return await this.page.evaluate((e) => getComputedStyle(e), selectableOptionElement)
  }

  async selectTositelaji(value: 'XE' | 'XB'): Promise<void> {
    await this.page.selectOption('select#document-type', value)
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
    await this.page.fill('#register-number', registerNumber)
    await this.hauntiedotLocators().hakuName.fi.fill(avustushakuName)
    await this.page.fill('#haku-name-sv', avustushakuName + ' på svenska')

    await this.selectVaCodes(vaCodes)

    if (installment === Installment.MultipleInstallments) {
      await this.page.locator('text=Useampi maksuerä').click()
      await this.page.locator('text=Kaikille avustuksen saajille').click()
      await this.page.locator('select#transaction-account').selectOption('5000')
    }

    const taTili = this.hauntiedotLocators().taTili
    await taTili.tili(0).input.fill(talousarviotili.code)
    await this.page.keyboard.press('ArrowDown')
    await this.page.keyboard.press('Enter')
    await taTili.tili(0).koulutusaste(0).input.fill('Ammatillinen koulutus')
    await this.page.keyboard.press('ArrowDown')
    await this.page.keyboard.press('Enter')

    if (arvioituMaksupaiva) {
      await this.page.fill('[name="arvioitu_maksupaiva"]', formatDate(arvioituMaksupaiva))
    }

    if (jaossaOlevaSumma !== undefined) {
      await this.page.fill('#total-grant-size', String(jaossaOlevaSumma))
    }

    await this.selectTositelaji('XE')
    await this.page.fill('#hakuaika-start', formatDate(hakuaikaStart))
    await this.page.fill('#hakuaika-end', formatDate(hakuaikaEnd))
    await this.addValmistelija('Viivi Virkailija')
    await this.addArvioija('Päivi Pääkäyttäjä')

    for (let i = 0; i < selectionCriteria.length; i++) {
      await this.page.getByTestId('add-selection-criteria').click()
      await this.page.fill(`#selection-criteria-${i}-fi`, selectionCriteria[i])
      await this.page.fill(`#selection-criteria-${i}-sv`, selectionCriteria[i])
    }

    for (let i = 0; i < raportointivelvoitteet.length; i++) {
      await this.selectRaportointilaji(i, raportointivelvoitteet[i].raportointilaji)
      await this.page.fill(`[name="maaraaika-${i}"]`, raportointivelvoitteet[i].maaraaika)
      await this.page.fill(`[id="asha-tunnus-${i}"]`, raportointivelvoitteet[i].ashaTunnus)
      if (raportointivelvoitteet[i].lisatiedot) {
        await this.page.fill(`[id="lisatiedot-${i}"]`, raportointivelvoitteet[i].lisatiedot ?? '')
      }
      await this.page.click(`[id="new-raportointivelvoite-${i}"]`)
    }

    for (const saadanto of lainsaadanto) {
      await this.page.locator(`label:has-text("${saadanto}")`).click()
    }

    await this.switchToPaatosTab()
    await this.page.fill(
      '[data-test-id="hankkeen-alkamispaiva"] div.datepicker input',
      hankkeenAlkamispaiva
    )
    await this.page.fill(
      '[data-test-id="hankkeen-paattymispaiva"] div.datepicker input',
      hankkeenPaattymispaiva
    )
    await this.page.fill('[id="decision.taustaa.fi"]', 'taustaa')
    await this.switchToHaunTiedotTab()
    await this.waitForSave()
  }

  async addValmistelija(name: string) {
    await this.searchUsersForRoles(name)
    await this.selectUser(name)
  }

  async addArvioija(name: string) {
    await this.searchUsersForRoles(name)
    await this.selectUser(name)
    await this.setUserRole(name, 'evaluator')
  }

  async addVastuuvalmistelija(name: string) {
    await this.searchUsersForRoles(name)
    await this.selectUser(name)
    await this.setUserRole(name, 'vastuuvalmistelija')
  }

  async createHakuWithLomakeJson(
    lomakeJson: string,
    hakuProps: HakuProps
  ): Promise<{ avustushakuID: number }> {
    const avustushakuID = await this.copyEsimerkkihaku()
    await this.fillAvustushaku(hakuProps)
    const formEditorPage = await this.navigateToFormEditor(avustushakuID)

    if (hakuProps.hakemusFields.length) {
      const newJson = addFieldsToHakemusJson(lomakeJson, hakuProps.hakemusFields)
      await formEditorPage.changeLomakeJson(newJson)
    } else {
      await formEditorPage.changeLomakeJson(lomakeJson)
    }

    await formEditorPage.saveForm()
    return { avustushakuID }
  }

  async publishAvustushaku() {
    await this.page.click("label[for='set-status-published']")
    await this.waitForSave()
  }

  async setAvustushakuInDraftState() {
    await this.page.click("label[for='set-status-draft']")
    await this.waitForSave()
  }

  async setStartDate(time: moment.Moment) {
    const selector = '#hakuaika-start'
    await this.page.fill(selector, formatDate(time))
    await this.page.$eval(selector, (e) => e.blur())
    await this.waitForSave()
  }

  async setEndDate(endTime: string) {
    const selector = '#hakuaika-end'
    await this.page.fill(selector, endTime)
    await this.page.$eval(selector, (e) => e.blur())
    await this.waitForSave()
  }

  async setAvustushakuEndDateToTomorrow() {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowString = `${tomorrow.getDate()}.${
      tomorrow.getMonth() + 1
    }.${tomorrow.getFullYear()} ${tomorrow.getHours()}.${tomorrow.getMinutes()}`
    await this.setEndDate(tomorrowString)
  }

  async closeAvustushakuByChangingEndDateToPast() {
    const previousYear = new Date().getFullYear() - 1
    await this.setEndDate(`1.1.${previousYear} 0.00`)
  }

  async createMuutoshakemusEnabledHaku(hakuProps: HakuProps) {
    const avustushakuID = await this.createUnpublishedMuutoshakemusEnabledHaku(hakuProps)
    await this.publishAvustushaku()
    return avustushakuID
  }

  async createUnpublishedMuutoshakemusEnabledHaku(hakuProps: HakuProps) {
    const muutoshakemusEnabledHakuLomakeJson = await fs.readFile(
      path.join(__dirname, '../fixtures/prod.hakulomake.json'),
      'utf8'
    )
    const { avustushakuID } = await this.createHakuWithLomakeJson(
      muutoshakemusEnabledHakuLomakeJson,
      hakuProps
    )
    await this.switchToHaunTiedotTab()
    return avustushakuID
  }

  async createBudjettimuutosEnabledHaku(hakuProps: HakuProps) {
    const muutoshakemusEnabledHakuLomakeJson = await fs.readFile(
      path.join(__dirname, '../fixtures/budjettimuutos.hakulomake.json'),
      'utf8'
    )
    const { avustushakuID } = await this.createHakuWithLomakeJson(
      muutoshakemusEnabledHakuLomakeJson,
      hakuProps
    )
    await this.switchToHaunTiedotTab()
    await this.publishAvustushaku()
    return avustushakuID
  }

  async createKoulutusasteHaku(hakuProps: HakuProps) {
    const lomakeJson = await fs.readFile(
      path.join(__dirname, '../fixtures/koulutusosio.hakulomake.json'),
      'utf8'
    )
    const { avustushakuID } = await this.createHakuWithLomakeJson(lomakeJson, hakuProps)
    await this.navigate(avustushakuID)
    await this.publishAvustushaku()
    return avustushakuID
  }

  async allowExternalApi(allow: boolean) {
    await this.page.click(`label[for="allow_visibility_in_external_system_${allow}"]`)
    await this.waitForSave()
  }

  hakuListingTableSelectors() {
    const hakuList = this.page.locator('#haku-listing')
    const hakuRows = hakuList.locator('tbody tr')
    const baseTableLocators = (columnTestId: string) => ({
      cellValue: (trTestId: string) => hakuList.getByTestId(trTestId).getByTestId(columnTestId),
      cellValues: () => hakuRows.getByTestId(columnTestId).allInnerTexts(),
      sort: this.page.getByTestId(`sort-button-${columnTestId}`),
    })
    return {
      hakuList,
      hakuRows,
      avustushaku: {
        ...baseTableLocators('avustushaku'),
        input: this.page.locator('[placeholder="Avustushaku"]'),
      },
      tila: {
        ...baseTableLocators('status'),
        toggle: this.page.locator('button:has-text("Tila")'),
        uusiCheckbox: this.page.locator('label:has-text("Uusi")'),
      },
      vaihe: {
        ...baseTableLocators('phase'),
        toggle: this.page.locator('button:has-text("Vaihe")'),
        kiinniCheckbox: this.page.locator('label:has-text("Kiinni")'),
      },
      hakuaika: {
        ...baseTableLocators('hakuaika'),
        toggle: this.page.locator('button:has-text("Hakuaika")'),
        clear: this.page.locator('[aria-label="Tyhjennä hakuaika rajaukset"]'),
        hakuaikaStart: this.page.locator(
          '[aria-label="Rajaa avustushaut niihin joiden hakuaika alkaa päivämääränä tai sen jälkeen"] input'
        ),
        hakuaikaEnd: this.page.locator(
          '[aria-label="Rajaa avustushaut niihin joiden hakuaika päättyy päivämääränä tai sitä ennen"] input'
        ),
      },
      paatos: baseTableLocators('paatos'),
      valiselvitykset: baseTableLocators('valiselvitykset'),
      loppuselvitykset: baseTableLocators('loppuselvitykset'),
      vastuuvalmistelija: baseTableLocators('valmistelija'),
      muutoshakukelpoinen: baseTableLocators('muutoshakukelpoinen'),
      maksatukset: baseTableLocators('maksatukset'),
      kayttoaikaAlkaa: baseTableLocators('kayttoaikaAlkaa'),
      kayttoaikaPaattyy: baseTableLocators('kayttoaikaPaattyy'),
      jaossaOllutSumma: baseTableLocators('jaossaOllutSumma'),
      maksettuSumma: baseTableLocators('maksettuSumma'),
      budjetti: baseTableLocators('budjetti'),
    }
  }

  hauntiedotLocators() {
    return {
      hakuName: {
        fi: this.page.locator('#haku-name-fi'),
      },
      taTili: {
        tili: (index: number) => {
          const tiliLocator = this.page.locator(`#ta-tili-select-${index}`)
          const container = this.page.locator(`#ta-tili-container-${index}`)
          return {
            ...createReactSelectLocators(tiliLocator, 'taTiliSelection'),
            koulutusaste: (index: number) => {
              const selectLocator = container.locator(`#koulutusaste-select-${index}`)
              return {
                ...createReactSelectLocators(selectLocator, 'koulutusasteSelection'),
                select: selectLocator,
                addKoulutusasteBtn: container.locator(
                  'button[title="Lisää uusi koulutusastevalinta"]'
                ),
                removeKoulutusasteBtn: (aste: string) =>
                  container.locator(
                    `button[title="Poista koulutusaste ${aste} talousarviotililtä"]`
                  ),
              }
            },
            addTiliBtn: container.locator('button[title="Lisää talousarviotili"]'),
            removeTiliBtn: container.locator('button[title="Poista talousarviotili"]'),
          }
        },
      },
    }
  }
}
