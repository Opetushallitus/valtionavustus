import { expect, Page } from '@playwright/test'
import { MaksatuksetPage } from './maksatuksetPage'
import { HakulomakePage } from './HakulomakePage'
import { PaatosPage } from './PaatosPage'
import { ValiselvitysPage } from './ValiselvitysPage'
import { LoppuselvitysPage } from './LoppuselvitysPage'
import { HaunTiedotPage } from './HaunTiedotPage'

export const saveStatusTestId = 'save-status'

export async function waitForSave(page: Page) {
  await expect(
    page.getByTestId(saveStatusTestId).getByText('Kaikki tiedot tallennettu')
  ).toBeVisible({ timeout: 10000 })
}
export async function waitForSaveWithError(page: Page) {
  await expect(
    page.getByTestId(saveStatusTestId).getByText('Jossain kentässä puutteita. Tarkasta arvot.')
  ).toBeVisible({ timeout: 10000 })
}

export const CommonHakujenHallintaPage = (page: Page) => {
  const hakuListingTableLocators = () => {
    const hakuList = page.locator('#haku-listing')
    const hakuRows = hakuList.locator('tbody tr')
    const baseTableLocators = (columnTestId: string) => ({
      cellValue: (trTestId: string) => hakuList.getByTestId(trTestId).getByTestId(columnTestId),
      cellValues: () => hakuRows.getByTestId(columnTestId).allInnerTexts(),
      sort: page.getByTestId(`sort-button-${columnTestId}`),
    })
    return {
      hakuList,
      hakuRows,
      avustushaku: {
        ...baseTableLocators('avustushaku'),
        input: page.locator('[placeholder="Avustushaku"]'),
      },
      tila: {
        ...baseTableLocators('status'),
        toggle: page.locator('button:has-text("Tila")'),
        uusiCheckbox: page.locator('label:has-text("Uusi")'),
      },
      vaihe: {
        ...baseTableLocators('phase'),
        toggle: page.locator('button:has-text("Vaihe")'),
        kiinniCheckbox: page.locator('label:has-text("Kiinni")'),
      },
      hakuaika: {
        ...baseTableLocators('hakuaika'),
        toggle: page.locator('button:has-text("Hakuaika")'),
        clear: page.locator('[aria-label="Tyhjennä hakuaika rajaukset"]'),
        hakuaikaStart: page.locator(
          '[aria-label="Rajaa avustushaut niihin joiden hakuaika alkaa päivämääränä tai sen jälkeen"] input'
        ),
        hakuaikaEnd: page.locator(
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
  const tabLocators = {
    haunTiedot: page.getByTestId('haun-tiedot-välilehti'),
    hakulomake: page.getByTestId('hakulomake-välilehti'),
    paatos: page.getByTestId('päätös-välilehti'),
    valiselvitys: page.getByTestId('väliselvitys-välilehti'),
    loppuselvitys: page.getByTestId('loppuselvitys-välilehti'),
    maksatukset: page.locator('a').getByText('Maksatukset'),
  }
  const locators = {
    hakuListingTable: hakuListingTableLocators(),
    tabs: tabLocators,
    loadingAvustushaku: page.getByTestId(saveStatusTestId).locator('text=Ladataan tietoja'),
    savingToast: page.getByTestId(saveStatusTestId),
  }
  async function switchToMaksatuksetTab() {
    await tabLocators.maksatukset.click()
    return MaksatuksetPage(page)
  }
  async function switchToHaunTiedotTab() {
    await tabLocators.haunTiedot.click()
    const haunTiedotPage = HaunTiedotPage(page)
    await expect(haunTiedotPage.locators.registerNumber).toBeVisible()
    return haunTiedotPage
  }
  async function switchToHakulomakeTab() {
    //await this.page.getByTestId('hakulomake-välilehti').click()
    await tabLocators.hakulomake.click()
    const hakulomakePage = HakulomakePage(page)
    await hakulomakePage.waitFormToBeLoaded()
    return hakulomakePage
  }
  async function switchToPaatosTab() {
    await tabLocators.paatos.click()
    return PaatosPage(page)
  }
  async function switchToValiselvitysTab() {
    await tabLocators.valiselvitys.click()
    await expect(page.getByRole('heading', { name: 'Väliselvityslomake' })).toBeVisible()
    return ValiselvitysPage(page)
  }
  async function switchToLoppuselvitysTab() {
    await tabLocators.loppuselvitys.click()
    await expect(page.getByRole('heading', { name: 'Loppuselvityslomake' })).toBeVisible()
    return LoppuselvitysPage(page)
  }
  async function waitForSave() {
    await expect(
      page.getByTestId(saveStatusTestId).locator('text="Kaikki tiedot tallennettu"')
    ).toBeVisible({ timeout: 10000 })
  }
  return {
    locators,
    switchToHaunTiedotTab,
    switchToMaksatuksetTab,
    switchToHakulomakeTab,
    switchToPaatosTab,
    switchToValiselvitysTab,
    switchToLoppuselvitysTab,
    waitForSave,
  }
}
