import { expect, Page } from '@playwright/test'

import { navigate } from '../utils/navigate'

type SelvitysType = 'vali' | 'loppu'

function SelvitysTab(page: Page, type: SelvitysType) {
  const umlautType = type === 'vali' ? 'väli' : 'loppu'

  async function acceptSelvitys() {
    await page.click('text=Lähetä viesti')
    await page.waitForSelector(`text=Lähetetty ${umlautType}selvityksen hyväksyntä`)
  }

  async function acceptInstallment(installmentSum: string) {
    const moneyField = `[data-test-id="hakemus-details-${type}selvitys"] [class="payment-money-column"] input`
    await page.locator(moneyField).fill(installmentSum)
    await page.locator(`text=/Lisää.* erä maksatuslistaan/i`).click()
    await waitForSave()
  }

  async function waitForSave() {
    await expect(page.locator('text=Kaikki tiedot tallennettu')).toBeVisible()
  }

  return {
    acceptSelvitys,
    acceptInstallment,
  }
}

export function VirkailijaValiselvitysPage(page: Page) {
  async function navigateToValiselvitysTab(avustushakuID: number, hakemusID: number) {
    return await navigateToSelvitysTab(avustushakuID, hakemusID, 'vali')
  }

  async function navigateToLoppuselvitysTab(avustushakuID: number, hakemusID: number) {
    return await navigateToSelvitysTab(avustushakuID, hakemusID, 'loppu')
  }

  async function navigateToSelvitysTab(
    avustushakuID: number,
    hakemusID: number,
    type: SelvitysType
  ) {
    await navigate(page, `/avustushaku/${avustushakuID}/hakemus/${hakemusID}/${type}selvitys/`)
    await page.waitForSelector(`[data-test-id="hakemus-details-${type}selvitys"]`, {
      state: 'visible',
    })

    return SelvitysTab(page, type)
  }

  return {
    navigateToValiselvitysTab,
    acceptVäliselvitys: SelvitysTab(page, 'vali').acceptSelvitys,
    navigateToLoppuselvitysTab,
    linkToHakemus: page.locator('text="Linkki lomakkeelle"'),
    warning: page.locator('#selvitys-not-sent-warning'),
  }
}
