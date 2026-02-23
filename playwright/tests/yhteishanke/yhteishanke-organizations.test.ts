import { expect, Page } from '@playwright/test'
import { yhteishankeTest as test } from '../../fixtures/yhteishankeTest'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'

const otherOrganization = (page: Page, index: number) => {
  const indexStartsFromOne = index + 1
  const baseLocator = page.locator(`[id="other-organizations-${indexStartsFromOne}"]`)
  return {
    name: baseLocator.locator(
      `[id="other-organizations.other-organizations-${indexStartsFromOne}.name"]`
    ),
    contactPerson: baseLocator.locator(
      `[id="other-organizations.other-organizations-${indexStartsFromOne}.contactperson"]`
    ),
    email: baseLocator.locator(
      `[id="other-organizations.other-organizations-${indexStartsFromOne}.email"]`
    ),
    remove: baseLocator.getByTitle('poista'),
  }
}

test.describe('yhteishanke organizations', () => {
  test('can fill multiple organizations and submit', async ({ page, submittedHakemusUrl }) => {
    const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
    const first = otherOrganization(page, 0)
    const second = otherOrganization(page, 1)

    await test.step('enable combined-effort', async () => {
      await page.locator("[for='combined-effort.radio.0']").click()
      await expect(first.name).toBeVisible()
    })

    await test.step('fill first organization', async () => {
      await first.name.fill('Ensimmäinen Organisaatio Oy')
      await first.contactPerson.fill('Eka Henkilö')
      await first.email.fill('eka@ensimmainen.fi')
    })

    await test.step('second organization row becomes enabled', async () => {
      await expect(second.name).toBeEnabled()
    })

    await test.step('fill second organization', async () => {
      await second.name.fill('Toinen Organisaatio Oy')
      await second.contactPerson.fill('Toka Henkilö')
      await second.email.fill('toka@toinen.fi')
    })

    await test.step('fill remaining required fields and submit', async () => {
      await page.locator("[id='project-costs-row.amount']").fill('20000')
      await page.locator("[for='type-of-organization.radio.0']").click()
      await page.locator("[id='signature']").fill('Erkki Esimerkki')
      await page.locator("[id='signature-email']").fill('erkki@example.com')
      await page.locator('#bank-iban').fill('FI95 6682 9530 0087 65')
      await page.locator('#bank-bic').fill('OKOYFIHH')

      await hakijaAvustusHakuPage.waitForEditSaved()
      await hakijaAvustusHakuPage.submitApplication()
    })
  })
})
