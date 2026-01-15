import path from 'node:path'
import fs from 'node:fs/promises'

import { expect } from '@playwright/test'
import { defaultValues } from '../../fixtures/defaultValues'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'

const AKAAN_KAUPUNKI_BUSINESS_ID = '2050864-5'
const EXPECTED_ORGANIZATION_NAME = 'Akaan kaupunki'
const EXPECTED_ORGANIZATION_EMAIL = 'hakija-1424884@oph.fi'
const EXPECTED_ORGANIZATION_ADDRESS = 'PL 34 37801 AKAA'

const test = defaultValues.extend<{
  hakijaAvustusHakuPage: ReturnType<typeof HakijaAvustusHakuPage>
}>({
  hakijaAvustusHakuPage: async ({ page, answers, hakuProps, userCache }, use) => {
    expect(userCache).toBeDefined()
    const hakujenHallintaPage = new HakujenHallintaPage(page)

    const esimerkkiHakuWithContactDetails = await fs.readFile(
      path.join(__dirname, '../../fixtures/avustushaku-with-contact-details.json'),
      'utf8'
    )

    const { avustushakuID } = await hakujenHallintaPage.createHakuWithLomakeJson(
      esimerkkiHakuWithContactDetails,
      hakuProps
    )
    await hakujenHallintaPage.commonHakujenHallinta.switchToHaunTiedotTab()

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

test('business ID prefill shows confirmation and fills organization details', async ({
  hakijaAvustusHakuPage,
}) => {
  const { page } = hakijaAvustusHakuPage

  await test.step('modal is visible on page load', async () => {
    await expect(page.locator('#finnish-business-id')).toBeVisible()
    await expect(page.locator('input.get-business-id')).toBeVisible()
  })

  await test.step('info texts are visible before fetching organization data', async () => {
    const infoSection = page.locator('.organisation-selection-info')
    await expect(infoSection).toBeVisible()

    // Verify all three info texts are present
    await expect(infoSection).toContainText('Tiedot haetaan YTJ:stä')
    await expect(infoSection).toContainText('Mikäli hakijalla ei ole tietoja YTJ:ssä')
    await expect(infoSection).toContainText('Jos hakujärjestelmä ei tunnista hakijan Y-tunnusta')

    // Verify the email link is present and correct
    const emailLink = infoSection.locator('a[href="mailto:yhteisetpalvelut@oph.fi"]')
    await expect(emailLink).toBeVisible()
    await expect(emailLink).toHaveText('yhteisetpalvelut@oph.fi')
  })

  await test.step('fetch button is disabled for invalid business ID', async () => {
    await page.fill('#finnish-business-id', 'invalid-id')
    await expect(page.locator('input.get-business-id')).toBeDisabled()
  })

  await test.step('fetch button is enabled for valid business ID format', async () => {
    await page.fill('#finnish-business-id', AKAAN_KAUPUNKI_BUSINESS_ID)
    await expect(page.locator('input.get-business-id')).toBeEnabled()
  })

  await test.step('clicking fetch shows language selection with organization details', async () => {
    await page.click('input.get-business-id')

    await expect(page.locator('[data-test-id="organisation-selection-fi"]')).toBeVisible({
      timeout: 5000,
    })
    await expect(page.locator('[data-test-id="organisation-selection-fi"]')).toContainText(
      EXPECTED_ORGANIZATION_NAME
    )
    await expect(page.locator('[data-test-id="organisation-selection-fi"]')).toContainText(
      EXPECTED_ORGANIZATION_EMAIL
    )
    await expect(page.locator('[data-test-id="organisation-selection-fi"]')).toContainText(
      AKAAN_KAUPUNKI_BUSINESS_ID
    )
  })

  await test.step('selecting Finnish organization and confirming closes modal and prefills fields', async () => {
    await page.click('[data-test-id="organisation-selection-fi"]')
    await expect(page.locator('[data-test-id="organisation-selection-fi"]')).toHaveClass(/selected/)

    await expect(page.locator('[data-test-id="confirm-selection"]')).toBeEnabled()
    await page.click('[data-test-id="confirm-selection"]')

    await expect(page.locator('[data-test-id="organisation-selection-fi"]')).not.toBeVisible()

    await expect(page.locator('#organization')).toHaveValue(EXPECTED_ORGANIZATION_NAME)
    await expect(page.locator('#organization-email')).toHaveValue(EXPECTED_ORGANIZATION_EMAIL)
    await expect(page.locator('#business-id')).toHaveValue(AKAAN_KAUPUNKI_BUSINESS_ID)
    await expect(page.locator('#organization-postal-address')).toHaveValue(
      EXPECTED_ORGANIZATION_ADDRESS
    )
  })

  await test.step('prefilled organization fields are disabled', async () => {
    await expect(page.locator('#organization')).toBeDisabled()
    await expect(page.locator('#organization-email')).toBeDisabled()
    await expect(page.locator('#business-id')).toBeDisabled()
    await expect(page.locator('#organization-postal-address')).toBeDisabled()
  })

  await test.step('prefilled fields remain disabled after page refresh', async () => {
    await page.reload()

    // Wait for form to load
    await expect(page.locator('#organization')).toBeVisible()

    // Verify fields still have values
    await expect(page.locator('#organization')).toHaveValue(EXPECTED_ORGANIZATION_NAME)
    await expect(page.locator('#organization-email')).toHaveValue(EXPECTED_ORGANIZATION_EMAIL)
    await expect(page.locator('#business-id')).toHaveValue(AKAAN_KAUPUNKI_BUSINESS_ID)
    await expect(page.locator('#organization-postal-address')).toHaveValue(
      EXPECTED_ORGANIZATION_ADDRESS
    )

    // Verify fields are still disabled
    await expect(page.locator('#organization')).toBeDisabled()
    await expect(page.locator('#organization-email')).toBeDisabled()
    await expect(page.locator('#business-id')).toBeDisabled()
    await expect(page.locator('#organization-postal-address')).toBeDisabled()
  })
})
