import { expect, Page } from '@playwright/test'
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
    await page.getByRole('button', { name: 'Lähetä väliselvityspyynnöt', exact: true }).click()
    await expect(page.getByText(`Lähetetty ${expectedAmount} viestiä`)).toBeVisible()
  }
  return {
    locators,
    sendValiselvitys,
    goToPreview,
    hakulomakePage: HakulomakePage(page),
    ...SelvitysTab(page, 'vali'),
  }
}
