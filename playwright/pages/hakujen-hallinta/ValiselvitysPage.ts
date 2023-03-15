import { Page } from '@playwright/test'
import { HakulomakePage } from './HakulomakePage'
import SelvitysTab from './CommonSelvitysPage'

export const ValiselvitysPage = (page: Page) => {
  const locators = {
    tapahtumaloki: page.locator('div.tapahtumaloki'),
    updatedAt: page.locator('#valiselvitysUpdatedAt'),
    ohje: page.getByTestId('valiselvitys-ohje'),
  }
  async function sendValiselvitys(expectedAmount = 1) {
    await page.click('text="Lähetä väliselvityspyynnöt"')
    await page.waitForSelector(`text="Lähetetty ${expectedAmount} viestiä"`)
  }
  return {
    locators,
    sendValiselvitys,
    hakulomakePage: HakulomakePage(page),
    commonSelvitys: SelvitysTab(page),
  }
}
