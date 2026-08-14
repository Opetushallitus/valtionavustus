import path from 'node:path'
import fs from 'node:fs/promises'

import { expect, Page, Response } from '@playwright/test'
import { defaultValues } from '../../fixtures/defaultValues'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'

const AKAAN_KAUPUNKI_BUSINESS_ID = '2050864-5'
const EXPECTED_ORGANIZATION_NAME = 'Akaan kaupunki'
const EXPECTED_ORGANIZATION_EMAIL = 'hakija-1424884@oph.fi'
const EXPECTED_ORGANIZATION_ADDRESS = 'PL 34 37801 AKAA'

// Vaasa has separate finnish and swedish organisation details, so both are offered to the hakija
const VAASAN_KAUPUNKI_BUSINESS_ID = '0209602-6'
const EXPECTED_VAASA_FINNISH_NAME = 'Vaasan kaupunki'
const EXPECTED_VAASA_SWEDISH_NAME = 'Vasa stad'
const EXPECTED_VAASA_ORGANIZATION_EMAIL = 'hakija-8248263@oph.fi'

async function searchBusinessId(page: Page, businessId: string) {
  await page.locator('#finnish-business-id').fill(businessId)
  // the modal fires one request per language plus the omistajatyyppi lookup, and the confirm button
  // stays disabled until the omistajatyyppi lookup has settled
  const organisationResponse = (lang: 'fi' | 'sv') => (r: Response) =>
    r.url().includes('/api/organisations/') && r.url().includes(`lang=${lang}`)
  await Promise.all([
    page.waitForResponse(organisationResponse('fi')),
    page.waitForResponse(organisationResponse('sv')),
    page.waitForResponse((r) => r.url().includes('/api/organisation-type/')),
    page.locator('input.get-business-id').click(),
  ])
}

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
    const emailLink = infoSection.locator('a[href="mailto:valtionavustukset@oph.fi"]')
    await expect(emailLink).toBeVisible()
    await expect(emailLink).toHaveText('valtionavustukset@oph.fi')
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
    await searchBusinessId(page, AKAAN_KAUPUNKI_BUSINESS_ID)

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

  await test.step('the only organization found is preselected without radio buttons', async () => {
    await expect(page.locator('[data-test-id="organisation-selection-fi"]')).toHaveClass(/selected/)
    await expect(page.locator('[data-test-id="organisation-selection-sv"]')).toBeHidden()
    await expect(page.getByRole('radio')).toHaveCount(0)
    await expect(page.locator('[data-test-id="confirm-selection"]')).toBeEnabled()
  })

  await test.step('confirming closes modal and prefills fields', async () => {
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

test('business ID prefill requires choosing between Finnish and Swedish organization', async ({
  hakijaAvustusHakuPage,
}) => {
  const { page } = hakijaAvustusHakuPage
  const finnishSelection = page.locator('[data-test-id="organisation-selection-fi"]')
  const swedishSelection = page.locator('[data-test-id="organisation-selection-sv"]')
  const confirmButton = page.locator('[data-test-id="confirm-selection"]')

  await test.step('both organizations are offered as unselected radio buttons', async () => {
    await searchBusinessId(page, VAASAN_KAUPUNKI_BUSINESS_ID)

    await expect(finnishSelection).toContainText(EXPECTED_VAASA_FINNISH_NAME)
    await expect(swedishSelection).toContainText(EXPECTED_VAASA_SWEDISH_NAME)

    await expect(page.getByRole('radio')).toHaveCount(2)
    await expect(finnishSelection.getByRole('radio')).not.toBeChecked()
    await expect(swedishSelection.getByRole('radio')).not.toBeChecked()
  })

  await test.step('confirming is not possible before choosing', async () => {
    await expect(confirmButton).toBeDisabled()
  })

  await test.step('choosing the Swedish organization enables confirming', async () => {
    await swedishSelection.click()

    await expect(swedishSelection.getByRole('radio')).toBeChecked()
    await expect(finnishSelection.getByRole('radio')).not.toBeChecked()
    await expect(confirmButton).toBeEnabled()
  })

  await test.step('confirming prefills the chosen Swedish organization details', async () => {
    await confirmButton.click()

    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(page.locator('#organization')).toHaveValue(EXPECTED_VAASA_SWEDISH_NAME)
    await expect(page.locator('#organization-email')).toHaveValue(EXPECTED_VAASA_ORGANIZATION_EMAIL)
    await expect(page.locator('#business-id')).toHaveValue(VAASAN_KAUPUNKI_BUSINESS_ID)
  })
})

const swedishTest = defaultValues.extend<{
  hakijaAvustusHakuPage: ReturnType<typeof HakijaAvustusHakuPage>
}>({
  hakijaAvustusHakuPage: async ({ page, swedishAnswers, hakuProps, userCache }, use) => {
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
    await hakijaAvustusHakuPage.navigate(avustushakuID, swedishAnswers.lang)

    const hakemusUrl = await hakijaAvustusHakuPage.startApplication(
      avustushakuID,
      swedishAnswers.contactPersonEmail
    )
    await hakijaAvustusHakuPage.page.goto(hakemusUrl)
    await use(hakijaAvustusHakuPage)
  },
})

swedishTest(
  'business ID prefill shows Swedish contact email for Swedish language',
  async ({ hakijaAvustusHakuPage }) => {
    const { page } = hakijaAvustusHakuPage

    const infoSection = page.locator('.organisation-selection-info')
    await expect(infoSection).toBeVisible()

    const emailLink = infoSection.locator('a[href="mailto:statsunderstod@oph.fi"]')
    await expect(emailLink).toBeVisible()
    await expect(emailLink).toHaveText('statsunderstod@oph.fi')
  }
)
