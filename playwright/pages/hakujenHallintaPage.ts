import { expect, Locator, Page } from '@playwright/test'
import moment from 'moment'
import fs from 'fs/promises'
import path from 'path'

import { navigate } from '../utils/navigate'
import { expectQueryParameter } from '../utils/util'
import { VaCodeValues, Field } from '../utils/types'
import { addFieldsToHakemusJson } from '../utils/hakemus-json'
import { Talousarviotili } from '../../va-virkailija/web/va/koodienhallinta/types'
import { HakulomakePage } from './hakujen-hallinta/HakulomakePage'
import {
  CommonHakujenHallintaPage,
  saveStatusTestId,
  waitForSave,
} from './hakujen-hallinta/CommonHakujenHallintaPage'
import { ValiselvitysPage } from './hakujen-hallinta/ValiselvitysPage'
import { LoppuselvitysPage } from './hakujen-hallinta/LoppuselvitysPage'
import { HaunTiedotPage } from './hakujen-hallinta/HaunTiedotPage'

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

export class HakujenHallintaPage {
  readonly page: Page
  readonly valiselvitysUpdatedAt: Locator
  readonly loppuselvitysUpdatedAt: Locator
  readonly loadingAvustushaku: Locator
  readonly commonHakujenHallinta: ReturnType<typeof CommonHakujenHallintaPage>

  constructor(page: Page) {
    this.page = page
    this.valiselvitysUpdatedAt = this.page.locator('#valiselvitysUpdatedAt')
    this.loppuselvitysUpdatedAt = this.page.locator('#loppuselvitysUpdatedAt')
    this.loadingAvustushaku = this.page
      .getByTestId(saveStatusTestId)
      .locator('text=Ladataan tietoja')
    this.commonHakujenHallinta = CommonHakujenHallintaPage(this.page)
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
    return HaunTiedotPage(this.page)
  }

  async navigateToDefaultAvustushaku() {
    await this.navigateTo('/admin/haku-editor/?avustushaku=1')
    return HaunTiedotPage(this.page)
  }

  async navigateToValiselvitys(avustushakuID: number) {
    await this.navigateTo(`/admin/valiselvitys/?avustushaku=${avustushakuID}`)
    return ValiselvitysPage(this.page)
  }

  async navigateToLoppuselvitys(avustushakuID: number) {
    await this.navigateTo(`/admin/loppuselvitys/?avustushaku=${avustushakuID}`)
    return LoppuselvitysPage(this.page)
  }

  async navigateToFormEditor(avustushakuID: number) {
    await this.navigateTo(`/admin/form-editor/?avustushaku=${avustushakuID}`)
    const formEditorPage = HakulomakePage(this.page)
    await formEditorPage.waitFormToBeLoaded()
    return formEditorPage
  }

  async switchToValiselvitysTab() {
    await this.page.getByTestId('väliselvitys-välilehti').click()
    return ValiselvitysPage(this.page)
  }

  async switchToLoppuselvitysTab() {
    await this.page.getByTestId('loppuselvitys-välilehti').click()
    return LoppuselvitysPage(this.page)
  }

  async sendLoppuselvitys(expectedAmount = 1) {
    await this.page.click('text="Lähetä loppuselvityspyynnöt"')
    await this.page.waitForSelector(`text="Lähetetty ${expectedAmount} viestiä"`)
  }

  async waitForSave() {
    await waitForSave(this.page)
  }

  async copyCurrentHaku(): Promise<number> {
    const waitForHakuCopyToBeCompleted = async (currentURL: string): Promise<void> => {
      await this.page.waitForFunction((url) => window.location.href !== url, currentURL)
      await this.page.waitForLoadState('networkidle')
      await expect(hakuNameFi).toHaveText(`${currentHakuTitle} (kopio)`)
      await expect(hakuNameFi).toBeEnabled()
    }
    const haunTiedotPage = HaunTiedotPage(this.page)
    const hakuNameFi = haunTiedotPage.locators.hakuName.fi
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

  raportointilajiSelector(index: number) {
    return `[id="raportointilaji-dropdown-${index}"]`
  }

  async selectRaportointilaji(index: number, raportointilaji: string): Promise<void> {
    await this.page.click(`${this.raportointilajiSelector(index)} > div`)
    await this.page.getByTestId(raportointilaji).click()
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
    const haunTiedotPage = HaunTiedotPage(this.page)
    await haunTiedotPage.locators.registerNumber.fill(registerNumber)
    await haunTiedotPage.locators.hakuName.fi.fill(avustushakuName)
    await haunTiedotPage.locators.hakuName.sv.fill(avustushakuName + ' på svenska')

    await haunTiedotPage.selectVaCodes(vaCodes)

    if (installment === Installment.MultipleInstallments) {
      await this.page.locator('text=Useampi maksuerä').click()
      await this.page.locator('text=Kaikille avustuksen saajille').click()
      await this.page.locator('select#transaction-account').selectOption('5000')
    }

    const taTili = haunTiedotPage.locators.taTili
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
    await haunTiedotPage.addValmistelija('Viivi Virkailija')
    await haunTiedotPage.addArvioija('Päivi Pääkäyttäjä')

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

    const paatosTab = await this.commonHakujenHallinta.switchToPaatosTab()
    await paatosTab.locators.hankkeenAlkamisPaiva.fill(hankkeenAlkamispaiva)
    await paatosTab.locators.hankkeenPaattymisPaiva.fill(hankkeenPaattymispaiva)
    await paatosTab.locators.taustaa.fill('taustaa')
    await this.commonHakujenHallinta.switchToHaunTiedotTab()
    await haunTiedotPage.common.waitForSave()
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

  async createMuutoshakemusEnabledHaku(hakuProps: HakuProps) {
    const avustushakuID = await this.createUnpublishedMuutoshakemusEnabledHaku(hakuProps)
    const haunTiedotPage = await this.commonHakujenHallinta.switchToHaunTiedotTab()
    await haunTiedotPage.publishAvustushaku()
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
    await this.commonHakujenHallinta.switchToHaunTiedotTab()
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
    const hauntiedotPage = await this.commonHakujenHallinta.switchToHaunTiedotTab()
    await hauntiedotPage.publishAvustushaku()
    return avustushakuID
  }

  async createKoulutusasteHaku(hakuProps: HakuProps) {
    const lomakeJson = await fs.readFile(
      path.join(__dirname, '../fixtures/koulutusosio.hakulomake.json'),
      'utf8'
    )
    const { avustushakuID } = await this.createHakuWithLomakeJson(lomakeJson, hakuProps)
    await this.navigate(avustushakuID)
    const haunTiedotPage = await this.commonHakujenHallinta.switchToHaunTiedotTab()
    await haunTiedotPage.publishAvustushaku()
    return avustushakuID
  }
}
