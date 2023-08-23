import { expect } from '@playwright/test'

import { clearAndType } from '../../../utils/util'

import { HakemustenArviointiPage } from '../../../pages/hakemustenArviointiPage'
import { selvitysTest as test } from '../../../fixtures/selvitysTest'
import { LoppuselvitysPage } from '../../../pages/hakujen-hallinta/LoppuselvitysPage'

test('virkailija can accept loppuselvitys', async ({
  page,
  asiatarkastus: { asiatarkastettu },
  acceptedHakemus,
}) => {
  expect(asiatarkastettu)
  const subject = 'Hieno homma'
  const content = 'Hyvä juttu'
  const additionalReceiver = 'buddy-boy@buddy.boy'
  let emailSendApiCalled = 0
  const loppuselvitysPage = LoppuselvitysPage(page)
  await test.step('virkailija accepts loppuselvitys', async () => {
    await page.route('**/loppuselvitys/send', (route) => {
      emailSendApiCalled++
      route.continue()
    })
    await loppuselvitysPage.locators.taloustarkastus.accept.click()
    await page.click('[data-test-id="taloustarkastus-add-receiver"]')
    await clearAndType(page, '[data-test-id="taloustarkastus-receiver-2"]', additionalReceiver)

    await clearAndType(page, '[data-test-id="taloustarkastus-email-subject"]', subject)
    await clearAndType(page, '[data-test-id="taloustarkastus-email-content"]', content)
    await loppuselvitysPage.locators.taloustarkastus.confirmAcceptance.click()
    await expect(loppuselvitysPage.locators.taloustarkastus.confirmAcceptance).toBeHidden()
    await expect(loppuselvitysPage.locators.taloustarkastettu).toBeVisible()
    await expect(loppuselvitysPage.locators.taloustarkastus.accept).toBeDisabled()
    await expect(loppuselvitysPage.locators.asiatarkastus.accept).toBeDisabled()
    expect(emailSendApiCalled).toEqual(1)
  })

  await test.step('and sees which email was sent to hakija afterward', async () => {
    await loppuselvitysPage.locators.taloustarkastettu.click()
    await expect(page.getByText('Lähettäjäno-reply@oph.fi')).toBeVisible()
    await expect(
      page.getByText(
        `Vastaanottajaterkki.esimerkki@example.com, akaan.kaupunki@akaa.fi, ${additionalReceiver}`
      )
    ).toBeVisible()
    await expect(page.getByText(`Aihe${subject}`)).toBeVisible()
    await expect(page.getByText(content)).toBeVisible()
  })

  await test.step('loppuselvitys is shown as hyväksytty in hakemus listing', async () => {
    const arviointi = new HakemustenArviointiPage(page)
    await arviointi.closeHakemusDetails()
    await expect(arviointi.getLoppuselvitysStatus(acceptedHakemus.hakemusID)).toHaveText(
      'Hyväksytty'
    )
  })
})
