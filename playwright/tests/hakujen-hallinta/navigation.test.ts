import { expect, test } from '@playwright/test'
import { VIRKAILIJA_URL } from '../../utils/constants'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'

const urls = ['/admin', '/admin/', '/admin/haku-editor']

test.describe.parallel('navigating to hakujen hallinta', () => {
  for (const relativeUrl of urls) {
    test(`navigating works with ${relativeUrl}`, async ({ page }) => {
      const hakujenHallintaPage = new HakujenHallintaPage(page)
      const haunTiedot = hakujenHallintaPage.commonHakujenHallinta.locators.tabs.haunTiedot
      await page.goto(VIRKAILIJA_URL + relativeUrl)
      await expect(haunTiedot).toBeVisible()
      await expect(page.getByText('Valitse avustushaku yllä olevasta listasta')).toBeVisible()
    })
  }
})
