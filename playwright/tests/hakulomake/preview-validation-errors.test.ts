import path from 'node:path'
import fs from 'node:fs/promises'

import { expect, Page } from '@playwright/test'
import { defaultValues } from '../../fixtures/defaultValues'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'

const AKAAN_KAUPUNKI_BUSINESS_ID = '2050864-5'

const test = defaultValues.extend<{
  hakijaAvustusHakuPage: ReturnType<typeof HakijaAvustusHakuPage>
  hakujenHallintaPage: HakujenHallintaPage
  avustushakuID: number
  hakemusUrl: string
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
  hakujenHallintaPage: async ({ page }, use) => {
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    await use(hakujenHallintaPage)
  },
  avustushakuID: async ({ hakijaAvustusHakuPage }, use) => {
    const url = new URL(hakijaAvustusHakuPage.page.url())
    const avustushakuID = parseInt(url.pathname.split('/')[2])
    await use(avustushakuID)
  },
  hakemusUrl: async ({ hakijaAvustusHakuPage }, use) => {
    await use(hakijaAvustusHakuPage.page.url())
  },
})

async function captureValidationErrors(page: Page): Promise<string[]> {
  const errorSummary = page.locator('#form-error-summary')
  await expect(errorSummary).toBeVisible()

  const errorToggle = errorSummary.locator('.validation-errors-summary')
  await errorToggle.click()

  const errorPopup = errorSummary.locator('.popup.validation-errors')
  await expect(errorPopup).toBeVisible()

  const errorElements = await errorPopup.locator('.error').all()
  expect(errorElements.length).toBeGreaterThan(0)

  const validationErrors: string[] = []
  for (const errorElement of errorElements) {
    const errorText = await errorElement.textContent()
    if (errorText) {
      validationErrors.push(errorText.trim())
    }
  }

  return validationErrors
}

test('validation errors are shown in both editable and preview mode', async ({
  hakijaAvustusHakuPage,
  hakujenHallintaPage,
  avustushakuID,
  hakemusUrl,
}) => {
  const { page } = hakijaAvustusHakuPage
  let formValidationErrorsBeforeClose: string[] = []

  await test.step('fill business ID to create a draft with validation errors', async () => {
    await page.fill('#finnish-business-id', AKAAN_KAUPUNKI_BUSINESS_ID)
    await page.click('input.get-business-id')

    await expect(page.locator('[data-test-id="organisation-selection-fi"]')).toBeVisible({
      timeout: 5000,
    })
    await page.click('[data-test-id="organisation-selection-fi"]')
    await page.click('[data-test-id="confirm-selection"]')
  })

  await test.step('capture validation errors before avustushaku is closed', async () => {
    await page.reload()

    formValidationErrorsBeforeClose = await captureValidationErrors(page)
  })

  await test.step('close avustushaku to make form read-only', async () => {
    await hakujenHallintaPage.navigate(avustushakuID)
    const haunTiedotPage = await hakujenHallintaPage.commonHakujenHallinta.switchToHaunTiedotTab()

    await haunTiedotPage.closeAvustushakuByChangingEndDateToPast()
  })

  await test.step('navigate back to hakemus in preview mode', async () => {
    await page.goto(hakemusUrl)
  })

  await test.step('verify same validation errors are shown in preview mode', async () => {
    const previewValidationErrors = await captureValidationErrors(page)

    expect(previewValidationErrors.length).toBe(formValidationErrorsBeforeClose.length)

    for (const error of formValidationErrorsBeforeClose) {
      expect(previewValidationErrors).toContain(error)
    }
  })
})
