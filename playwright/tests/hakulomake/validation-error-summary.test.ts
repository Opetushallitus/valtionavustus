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

test('the error summary lists the missing answers of a new hakemus while sending is disabled', async ({
  hakijaAvustusHakuPage,
  answers,
}) => {
  const { page, sendHakemusButton } = hakijaAvustusHakuPage
  const errorSummaryToggle = page.locator('#form-error-summary .validation-errors-summary')
  const errorList = page.locator('#form-error-summary .popup.validation-errors')
  const { applicantName, contactPhoneNumber } = hakijaAvustusHakuPage.form.muutoshakuEnabledFields

  await test.step('a hakemus that has never been saved shows no error summary', async () => {
    await expect(page.locator('#entity-version')).toHaveText('1')
    await expect(sendHakemusButton).toBeDisabled()
    await expect(page.locator('#form-error-summary')).toBeHidden()
  })

  await test.step('confirming the organisation lists the remaining missing answers', async () => {
    await hakijaAvustusHakuPage.fillInBusinessId(AKAAN_KAUPUNKI_BUSINESS_ID)
    await expect(sendHakemusButton).toBeDisabled()
    await errorSummaryToggle.click()
    await expect(errorList.getByTestId('applicant-name')).toHaveText(
      'Yhteyshenkilö: Pakollinen tieto'
    )
    await expect(errorList.getByTestId('business-id')).toHaveCount(0)
  })

  await test.step('filling a missing answer removes it from the summary', async () => {
    await fillAndWaitForSave(page, applicantName, answers.contactPersonName)
    await expect(errorList.getByTestId('applicant-name')).toHaveCount(0)
    await expect(errorList.getByTestId('textField-0')).toHaveText('Puhelinumero: Pakollinen tieto')
    const errorCountBefore = parseInt((await errorSummaryToggle.textContent()) ?? '', 10)

    await fillAndWaitForSave(page, contactPhoneNumber, answers.contactPersonPhoneNumber)
    await expect(errorList.getByTestId('textField-0')).toHaveCount(0)
    await expect(errorSummaryToggle).toHaveText(`${errorCountBefore - 1} vastauksessa puutteita`)
    await expect(sendHakemusButton).toBeDisabled()
  })

  await test.step('the summary stays the same after a reload', async () => {
    const summaryAfterFilling = (await errorSummaryToggle.textContent()) ?? ''
    await page.reload()
    await expect(errorSummaryToggle).toHaveText(summaryAfterFilling)
  })
})
