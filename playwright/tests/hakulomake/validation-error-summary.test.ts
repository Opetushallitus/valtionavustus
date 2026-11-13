import path from 'node:path'
import fs from 'node:fs/promises'

import { expect, Locator, Page } from '@playwright/test'
import { defaultValues } from '../../fixtures/defaultValues'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'

const AKAAN_KAUPUNKI_BUSINESS_ID = '2050864-5'

const test = defaultValues.extend<{
  hakijaAvustusHakuPage: ReturnType<typeof HakijaAvustusHakuPage>
}>({
  hakijaAvustusHakuPage: async ({ page, answers, hakuProps, userCache }, use) => {
    expect(userCache).toBeDefined()
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const lomakeJson = await fs.readFile(
      path.join(__dirname, '../../fixtures/avustushaku-with-contact-details.json'),
      'utf8'
    )
    const avustushakuID = await hakujenHallintaPage.createPublishedAvustushaku(
      hakuProps,
      lomakeJson
    )

    const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
    await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang)
    const hakemusUrl = await hakijaAvustusHakuPage.startApplication(
      avustushakuID,
      answers.contactPersonEmail
    )
    await page.goto(hakemusUrl)
    await use(hakijaAvustusHakuPage)
  },
})

async function fillAndWaitForSave(page: Page, field: Locator, value: string) {
  await Promise.all([
    page.waitForResponse((response) => response.request().method() === 'POST' && response.ok()),
    field.fill(value),
  ])
  await expect(page.locator('#pending-changes')).toHaveText('false')
}

test('the error summary lists every missing answer of a new hakemus while sending is disabled', async ({
  hakijaAvustusHakuPage,
  answers,
}) => {
  const { page } = hakijaAvustusHakuPage
  const errorSummaryToggle = page.locator('#form-error-summary .validation-errors-summary')
  const errorList = page.locator('#form-error-summary .popup.validation-errors')
  const { applicantName, contactPhoneNumber } = hakijaAvustusHakuPage.form.muutoshakuEnabledFields

  await hakijaAvustusHakuPage.fillInBusinessId(AKAAN_KAUPUNKI_BUSINESS_ID)
  await fillAndWaitForSave(page, applicantName, answers.contactPersonName)

  await expect(hakijaAvustusHakuPage.sendHakemusButton).toBeDisabled()
  await expect(errorSummaryToggle).toBeVisible()
  const summaryOnFirstVisit = (await errorSummaryToggle.textContent()) ?? ''
  await errorSummaryToggle.click()
  await expect(errorList.getByTestId('textField-0')).toHaveText('Puhelinumero: Pakollinen tieto')

  await fillAndWaitForSave(page, contactPhoneNumber, answers.contactPersonPhoneNumber)
  await expect(errorList.getByTestId('textField-0')).toBeHidden()
  await expect(errorSummaryToggle).toHaveText(
    `${parseInt(summaryOnFirstVisit, 10) - 1} vastauksessa puutteita`
  )
  const summaryAfterFilling = (await errorSummaryToggle.textContent()) ?? ''

  await page.reload()
  await expect(errorSummaryToggle).toHaveText(summaryAfterFilling)
})

test('a hakemus that has never been saved shows no error summary while sending is disabled', async ({
  hakijaAvustusHakuPage,
}) => {
  const { page } = hakijaAvustusHakuPage

  await expect(page.locator('#entity-version')).toHaveText('1')
  await expect(hakijaAvustusHakuPage.sendHakemusButton).toBeDisabled()
  await expect(page.locator('#form-error-summary')).toBeHidden()
})

test('confirming the organisation lists the remaining missing answers while sending is disabled', async ({
  hakijaAvustusHakuPage,
}) => {
  const { page } = hakijaAvustusHakuPage
  const errorSummaryToggle = page.locator('#form-error-summary .validation-errors-summary')
  const errorList = page.locator('#form-error-summary .popup.validation-errors')

  await hakijaAvustusHakuPage.fillInBusinessId(AKAAN_KAUPUNKI_BUSINESS_ID)

  await expect(hakijaAvustusHakuPage.sendHakemusButton).toBeDisabled()
  await errorSummaryToggle.click()
  await expect(errorList.getByTestId('applicant-name')).toHaveText(
    'Yhteyshenkilö: Pakollinen tieto'
  )
  await expect(errorList.getByTestId('business-id')).toHaveCount(0)
})
