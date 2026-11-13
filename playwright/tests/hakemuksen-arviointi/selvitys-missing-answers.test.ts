import { expect, Page } from '@playwright/test'

import { navigate } from '../../utils/navigate'
import { selvitysTest as test } from '../../fixtures/selvitysTest'
import { HakijaSelvitysPage } from '../../pages/hakija/hakijaSelvitysPage'
import { ValiselvitysPage } from '../../pages/virkailija/hakujen-hallinta/ValiselvitysPage'
import { LoppuselvitysPage } from '../../pages/virkailija/hakujen-hallinta/LoppuselvitysPage'

async function expectFirstVisitListsEveryMissingAnswer(
  page: Page,
  untouchedField: { id: string; error: string }
) {
  const hakijaSelvitysPage = HakijaSelvitysPage(page)
  const errorSummaryToggle = page.locator('#form-error-summary .validation-errors-summary')
  const errorList = page.locator('#form-error-summary .popup.validation-errors')

  await Promise.all([
    page.waitForResponse((response) => response.request().method() === 'POST' && response.ok()),
    hakijaSelvitysPage.textArea(1).fill('Arviointi'),
  ])
  await expect(page.locator('#pending-changes')).toHaveText('false')

  await expect(hakijaSelvitysPage.submitButton).toBeDisabled()
  await expect(errorSummaryToggle).toBeVisible()
  const summaryOnFirstVisit = (await errorSummaryToggle.textContent()) ?? ''
  await errorSummaryToggle.click()
  await expect(errorList.getByTestId(untouchedField.id)).toHaveText(untouchedField.error)
  await expect(errorList.getByTestId('namedAttachment-0')).toHaveText(
    'Kirjanpidon pääkirjaote: Pakollinen tieto'
  )

  await page.reload()
  await expect(errorSummaryToggle).toHaveText(summaryOnFirstVisit)
}

test('the error summary lists every missing answer of a väliselvitys while sending is disabled', async ({
  page,
  avustushakuID,
  acceptedHakemus,
  väliselvityspyyntöSent,
}) => {
  expect(väliselvityspyyntöSent).toBeDefined()
  const valiselvitysPage = ValiselvitysPage(page)
  await valiselvitysPage.navigateToValiselvitysTab(avustushakuID, acceptedHakemus.hakemusID)
  const valiselvitysFormUrl = await valiselvitysPage.linkToHakemus.getAttribute('href')
  if (!valiselvitysFormUrl) throw Error('valiselvitys form url not found')
  await navigate(page, valiselvitysFormUrl)

  await expectFirstVisitListsEveryMissingAnswer(page, {
    id: 'project-name',
    error: 'Hankkeen nimi: Pakollinen tieto',
  })
})

test('the error summary lists every missing answer of a loppuselvitys while sending is disabled', async ({
  page,
  avustushakuID,
  acceptedHakemus,
  loppuselvityspyyntöSent,
}) => {
  expect(loppuselvityspyyntöSent).toBeDefined()
  const loppuselvitysPage = LoppuselvitysPage(page)
  await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, acceptedHakemus.hakemusID)
  await navigate(page, await loppuselvitysPage.getSelvitysFormUrl())

  await expectFirstVisitListsEveryMissingAnswer(page, {
    id: 'textArea-0',
    error: 'Lyhyt yhteenveto hankkeesta: Pakollinen tieto',
  })
})
