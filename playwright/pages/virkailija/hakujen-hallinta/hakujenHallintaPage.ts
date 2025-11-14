import { expect, Locator, Page, test } from '@playwright/test'
import moment from 'moment'
import fs from 'fs/promises'
import path from 'path'

import { navigate } from '../../../utils/navigate'
import { expectQueryParameter } from '../../../utils/util'
import { VaCodeValues, Field } from '../../../utils/types'
import { addFieldsToHakemusJson } from '../../../utils/hakemus-json'
import { Talousarviotili } from '../../../../va-virkailija/web/va/koodienhallinta-page/types'
import { HakulomakePage } from './HakulomakePage'
import {
  CommonHakujenHallintaPage,
  saveStatusTestId,
  waitForSave,
} from './CommonHakujenHallintaPage'
import { ValiselvitysPage } from './ValiselvitysPage'
import { LoppuselvitysPage } from './LoppuselvitysPage'
import { HaunTiedotPage } from './HaunTiedotPage'

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
  hallinoiavustuksiaRegisterNumber?: string
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
  valiselvitysDeadline?: string
  loppuselvitysDeadline?: string
  decisionDate?: string
}

export enum Installment {
  OneInstallment,
  MultipleInstallments,
}

const dateFormat = 'D.M.YYYY H.mm'
const formatDate = (date: Date | moment.Moment) => moment(date).format(dateFormat)
export const parseDate = (input: string) => moment(input, dateFormat).toDate()

export const hakuPath = (avustushakuID: number) =>
  `/admin/haku-editor/?avustushaku=${avustushakuID}`

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
    await this.page.locator(`text="Hakujen hallinta"`).click()
    await this.page.waitForURL(/\/admin\/haku-editor\//)
  }

  async navigateTo(path: string) {
    await navigate(this.page, path)
  }

  async navigate(avustushakuID: number) {
    await this.navigateTo(hakuPath(avustushakuID))
    return HaunTiedotPage(this.page)
  }

  async navigateToDefaultAvustushaku() {
    await this.navigateTo(hakuPath(1))
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
    await expect(this.page.getByRole('heading', { name: 'Loppuselvityslomake' })).toBeVisible()
    return LoppuselvitysPage(this.page)
  }

  async switchToHakulomakeTab() {
    await this.page.getByTestId('hakulomake-välilehti').click()
    return HakulomakePage(this.page)
  }

  async waitForSave() {
    await waitForSave(this.page)
  }

  async copyCurrentHaku(): Promise<number> {
    return await test.step('Copy current avustushaku', async () => {
      const haunTiedotPage = HaunTiedotPage(this.page)
      const hakuNameFi = haunTiedotPage.locators.hakuName.fi
      const currentHakuTitle = await hakuNameFi.textContent()
      await this.page.locator('a', { hasText: 'Kopioi uuden pohjaksi' }).click()
      await expect(hakuNameFi).toHaveText(`${currentHakuTitle} (kopio)`)
      await expect(hakuNameFi).toBeEnabled()
      const avustushakuID = parseInt(await expectQueryParameter(this.page, 'avustushaku'))
      console.log(`Avustushaku ID: ${avustushakuID}`)
      return avustushakuID
    })
  }

  async copyEsimerkkihaku(): Promise<number> {
    await this.navigate(2)
    return await this.copyCurrentHaku()
  }

  raportointilajiSelector(index: number) {
    return `[id="raportointilaji-dropdown-${index}"]`
  }

  async toggleRaportointilajiSelector(index: number): Promise<string> {
    const selector = `${this.raportointilajiSelector(index)} > div`
    await this.page.click(selector)
    return selector
  }

  async selectRaportointilaji(index: number, raportointilaji: string): Promise<void> {
    await this.toggleRaportointilajiSelector(index)
    await this.page.getByTestId(raportointilaji).click()
  }

  async selectTositelaji(value: 'XE' | 'XB'): Promise<void> {
    await this.page.selectOption('select#document-type', value)
  }

  async fillAvustushaku(hakuProps: HakuProps) {
    const haunTiedotPage = HaunTiedotPage(this.page)
    await this.fillAvustushakuWithoutWaitingForSave(hakuProps)
    await haunTiedotPage.common.waitForSave()
  }

  async fillAvustushakuWithoutWaitingForSave({
    avustushakuName,
    registerNumber,
    hallinoiavustuksiaRegisterNumber,
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
    valiselvitysDeadline,
    loppuselvitysDeadline,
    decisionDate,
  }: HakuProps) {
    await test.step('Fill in avustushaku details', async () => {
      const haunTiedotPage = HaunTiedotPage(this.page)

      const taTili = haunTiedotPage.locators.taTili
      await taTili.tili(0).input.fill(talousarviotili.code)
      await this.page.keyboard.press('ArrowDown')
      await this.page.keyboard.press('Enter')
      await taTili.tili(0).koulutusaste(0).input.fill('Ammatillinen koulutus')
      await this.page.keyboard.press('ArrowDown')
      await this.page.keyboard.press('Enter')

      await haunTiedotPage.locators.status.draft.click()
      await haunTiedotPage.locators.registerNumber.fill(registerNumber)
      if (hallinoiavustuksiaRegisterNumber) {
        await haunTiedotPage.locators.hallinoiavustuksiaRegisterNumber.fill(
          hallinoiavustuksiaRegisterNumber
        )
      }
      await haunTiedotPage.locators.hakuName.fi.fill(avustushakuName)
      await haunTiedotPage.locators.hakuName.sv.fill(avustushakuName + ' på svenska')

      await haunTiedotPage.selectVaCodes(vaCodes)

      if (installment === Installment.MultipleInstallments) {
        await this.page.locator('text=Useampi maksuerä').click()
        await this.page.locator('text=Kaikille avustuksen saajille').click()
        await this.page.locator('select#transaction-account').selectOption('5000')
      }

      await this.selectTositelaji('XE')
      for (let i = 0; i < selectionCriteria.length; i++) {
        await this.page.getByTestId('add-selection-criteria').click()
        await this.page.fill(`#selection-criteria-${i}-fi`, selectionCriteria[i])
        await this.page.fill(`#selection-criteria-${i}-sv`, selectionCriteria[i])
      }

      await this.fillRaportointiVelvoitteet(raportointivelvoitteet)

      for (const saadanto of lainsaadanto) {
        await this.page.locator(`label:has-text("${saadanto}")`).click()
      }

      if (arvioituMaksupaiva) {
        await this.page.fill('[name="arvioitu_maksupaiva"]', formatDate(arvioituMaksupaiva))
      }

      if (jaossaOlevaSumma !== undefined) {
        await this.page.fill('#total-grant-size', String(jaossaOlevaSumma))
      }

      await this.page.fill('#hakuaika-start', formatDate(hakuaikaStart))
      await this.page.fill('#hakuaika-end', formatDate(hakuaikaEnd))
      await haunTiedotPage.addValmistelija('Viivi Virkailija', false)
      await haunTiedotPage.addArvioija('Päivi Pääkäyttäjä', false)

      const paatosTab = await this.commonHakujenHallinta.switchToPaatosTab()
      await paatosTab.locators.hankkeenAlkamisPaiva.fill(hankkeenAlkamispaiva)
      await paatosTab.locators.hankkeenPaattymisPaiva.fill(hankkeenPaattymispaiva)
      await paatosTab.locators.taustaa.fill('taustaa')
      if (valiselvitysDeadline) {
        await paatosTab.locators.valiselvitysDate.fill(valiselvitysDeadline)
      }
      if (loppuselvitysDeadline) {
        await paatosTab.locators.loppuselvitysDate.fill(loppuselvitysDeadline)
      }
      if (decisionDate) {
        await paatosTab.locators.decisionDate.fill(decisionDate)
      }

      await this.commonHakujenHallinta.switchToHaunTiedotTab()
    })
  }

  async fillRaportointivelvoite(velvoite: Raportointivelvoite, raporttiIndex: number) {
    await this.selectRaportointilaji(raporttiIndex, velvoite.raportointilaji)
    await this.page.fill(`[name="maaraaika-${raporttiIndex}"]`, velvoite.maaraaika)
    await this.page.fill(`[id="asha-tunnus-${raporttiIndex}"]`, velvoite.ashaTunnus)
    if (velvoite.lisatiedot) {
      await this.page.fill(`[id="lisatiedot-${raporttiIndex}"]`, velvoite.lisatiedot!)
    }
  }

  async fillRaportointiVelvoitteet(raportointivelvoitteet: Raportointivelvoite[]) {
    for (let i = 0; i < raportointivelvoitteet.length; i++) {
      await this.fillRaportointivelvoite(raportointivelvoitteet[i], i)
      await this.page.click(`[id="new-raportointivelvoite-${i}"]`)
    }
  }

  async createHakuWithLomakeJson(
    lomakeJson: string,
    hakuProps: HakuProps
  ): Promise<{ avustushakuID: number }> {
    const avustushakuID = await this.copyEsimerkkihaku()
    await this.fillAvustushaku(hakuProps)
    const formEditorPage = await this.switchToHakulomakeTab()
    await formEditorPage.waitFormToBeLoaded()

    if (hakuProps.hakemusFields.length) {
      const newJson = addFieldsToHakemusJson(lomakeJson, hakuProps.hakemusFields)
      await formEditorPage.changeLomakeJson(newJson)
    } else {
      await formEditorPage.changeLomakeJson(lomakeJson)
    }

    await formEditorPage.saveForm()
    return { avustushakuID }
  }

  async createPublishedAvustushaku(hakuProps: HakuProps, hakulomake: string) {
    return await test.step('Create avustushaku', async () => {
      const { avustushakuID } = await this.createHakuWithLomakeJson(hakulomake, hakuProps)
      const haunTiedotPage = await this.commonHakujenHallinta.switchToHaunTiedotTab()
      await haunTiedotPage.publishAvustushaku()
      return avustushakuID
    })
  }

  async createMuutoshakemusEnabledHaku(hakuProps: HakuProps) {
    const avustushakuID = await this.createUnpublishedMuutoshakemusEnabledHaku(hakuProps)
    const haunTiedotPage = await this.commonHakujenHallinta.switchToHaunTiedotTab()
    await haunTiedotPage.publishAvustushaku()
    return avustushakuID
  }
  async toggleMuutoshakukelpoisuus(value: boolean) {
    const radioId = value ? 'muutoshakukelpoinen_true' : 'muutoshakukelpoinen_false'
    await this.page.click(`label[for="${radioId}"]`)
    await this.waitForSave()
  }
  async createUnpublishedMuutoshakemusEnabledHaku(hakuProps: HakuProps) {
    const muutoshakemusEnabledHakuLomakeJson = await fs.readFile(
      path.join(__dirname, '../../../fixtures/prod.hakulomake.json'),
      'utf8'
    )
    const { avustushakuID } = await this.createHakuWithLomakeJson(
      muutoshakemusEnabledHakuLomakeJson,
      hakuProps
    )
    await this.commonHakujenHallinta.switchToHaunTiedotTab()
    return avustushakuID
  }

  async createMuutoshakemusDisabledHaku(hakuProps: HakuProps) {
    const avustushakuID = await this.createUnpublishedMuutoshakemusDisabledHaku(hakuProps)
    const haunTiedotPage = await this.commonHakujenHallinta.switchToHaunTiedotTab()
    await this.toggleMuutoshakukelpoisuus(false)
    await haunTiedotPage.publishAvustushaku()
    return avustushakuID
  }
  async createUnpublishedMuutoshakemusDisabledHaku(hakuProps: HakuProps) {
    const muutoshakemusEnabledHakuLomakeJson = await fs.readFile(
      path.join(
        __dirname,
        '../../../fixtures/muutoshakukelvoton-project-name-missing.hakulomake.json'
      ),
      'utf8'
    )
    const { avustushakuID } = await this.createHakuWithLomakeJson(
      muutoshakemusEnabledHakuLomakeJson,
      hakuProps
    )
    return avustushakuID
  }

  async createBudjettimuutosEnabledHaku(hakuProps: HakuProps) {
    const muutoshakemusEnabledHakuLomakeJson = await fs.readFile(
      path.join(__dirname, '../../../fixtures/budjettimuutos.hakulomake.json'),
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
      path.join(__dirname, '../../../fixtures/koulutusosio.hakulomake.json'),
      'utf8'
    )
    const { avustushakuID } = await this.createHakuWithLomakeJson(lomakeJson, hakuProps)
    await this.navigate(avustushakuID)
    const haunTiedotPage = await this.commonHakujenHallinta.switchToHaunTiedotTab()
    await haunTiedotPage.publishAvustushaku()
    return avustushakuID
  }
}
