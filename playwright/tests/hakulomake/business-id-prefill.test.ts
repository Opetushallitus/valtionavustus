import { expect } from '@playwright/test'
import { defaultValues } from '../../fixtures/defaultValues'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'

const AKAAN_KAUPUNKI_BUSINESS_ID = '2050864-5'
const EXPECTED_ORGANIZATION_NAME = 'Akaan kaupunki'
const EXPECTED_ORGANIZATION_EMAIL = 'akaan.kaupunki@akaa.fi'
const EXPECTED_ORGANIZATION_ADDRESS = 'PL 34 37801 AKAA'

const test = defaultValues.extend<{
  hakijaAvustusHakuPage: ReturnType<typeof HakijaAvustusHakuPage>
}>({
  hakijaAvustusHakuPage: async ({ page, answers, hakuProps, userCache }, use) => {
    expect(userCache).toBeDefined()
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const avustushakuID = await hakujenHallintaPage.copyEsimerkkihaku()
    await hakujenHallintaPage.fillAvustushaku(hakuProps)
    const haunTiedotPage = await hakujenHallintaPage.commonHakujenHallinta.switchToHaunTiedotTab()
    await haunTiedotPage.publishAvustushaku()
    const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
    await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang)

    const hakemusUrl = await hakijaAvustusHakuPage.startApplication(
      avustushakuID,
      answers.contactPersonEmail
    )
    await hakijaAvustusHakuPage.page.goto(hakemusUrl)
    await use(hakijaAvustusHakuPage)
  },
})

test('business ID prefill fills organization details correctly', async ({
  hakijaAvustusHakuPage,
}) => {
  const { page } = hakijaAvustusHakuPage

  await test.step('modal is visible on page load', async () => {
    await expect(page.locator('#finnish-business-id')).toBeVisible()
    await expect(page.locator('input.get-business-id')).toBeVisible()
  })

  await test.step('submit button is disabled for invalid business ID', async () => {
    await page.fill('#finnish-business-id', 'invalid-id')
    await expect(page.locator('input.get-business-id')).toBeDisabled()
  })

  await test.step('submit button is enabled for valid business ID format', async () => {
    await page.fill('#finnish-business-id', AKAAN_KAUPUNKI_BUSINESS_ID)
    await expect(page.locator('input.get-business-id')).toBeEnabled()
  })

  await test.step('clicking submit closes modal and prefills organization fields', async () => {
    await page.click('input.get-business-id')
    await expect(page.locator('#finnish-business-id')).not.toBeVisible()
    await page.waitForTimeout(500)

    await expect(page.locator('#organization')).toHaveValue(EXPECTED_ORGANIZATION_NAME)
    await expect(page.locator('#organization-email')).toHaveValue(EXPECTED_ORGANIZATION_EMAIL)
    await expect(page.locator('#business-id')).toHaveValue(AKAAN_KAUPUNKI_BUSINESS_ID)
    await expect(page.locator('#organization-postal-address')).toHaveValue(
      EXPECTED_ORGANIZATION_ADDRESS
    )
  })
})
