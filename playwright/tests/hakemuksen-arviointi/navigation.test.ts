import { expect, test } from '@playwright/test'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { VIRKAILIJA_URL } from '../../utils/constants'

const urls = ['/', '/avustushaku', '/avustushaku/']

test.describe.parallel('navigating to hakemusten arviointi', () => {
  for (const relativeUrl of urls) {
    test(`navigating works with ${relativeUrl}`, async ({ page }) => {
      const hakemustenArviointiPage = new HakemustenArviointiPage(page)
      const locators = hakemustenArviointiPage.locators()
      await page.goto(VIRKAILIJA_URL + relativeUrl)
      await expect(locators.dropdown).toContainText('Valitse avustushaku listasta')
    })
  }
})
