import { Page } from '@playwright/test'
import { HakulomakePage } from './HakulomakePage'
import SelvitysTab from './CommonSelvitysPage'

export const ValiselvitysPage = (page: Page) => {
  const locators = {
    updatedAt: page.locator('#valiselvitysUpdatedAt'),
    ohje: page.getByTestId('valiselvitys-ohje'),
    previewFi: page.getByTestId('form-preview-fi'),
  }

  async function goToPreview() {
    const [previewPage] = await Promise.all([
      page.context().waitForEvent('page'),
      await locators.previewFi.click(),
    ])
    await previewPage.bringToFront()
    await previewPage.waitForLoadState()
    return previewPage
  }

  async function sendValiselvitys(expectedAmount = 1) {
    await page.click('text="Lähetä väliselvityspyynnöt"')
    await page.waitForSelector(`text="Lähetetty ${expectedAmount} viestiä"`)
  }
  return {
    locators,
    sendValiselvitys,
    goToPreview,
    hakulomakePage: HakulomakePage(page),
    ...SelvitysTab(page, 'vali'),
  }
}
