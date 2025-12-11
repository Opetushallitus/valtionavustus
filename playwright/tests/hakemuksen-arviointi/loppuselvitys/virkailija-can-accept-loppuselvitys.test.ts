import { expect } from '@playwright/test'

import { HakemustenArviointiPage } from '../../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { selvitysTest as test } from '../../../fixtures/selvitysTest'
import { LoppuselvitysPage } from '../../../pages/virkailija/hakujen-hallinta/LoppuselvitysPage'
import loppuselvitysWithEmail from '../selvitysForms/loppuselvitys-with-email.json'
import {
  waitUntilMinEmails,
  getLoppuselvitysSubmittedNotificationEmails,
} from '../../../utils/emails'

const emailFieldTest = test.extend({
  loppuselvitysForm: JSON.stringify(loppuselvitysWithEmail),
  loppuselvitysYhteyshenkilo: { name: 'VLyhteyshenkilo', email: 'LSyhteyshenkilo@example.com' },
})

emailFieldTest(
  'Loppuselvityksen hyväksymis sähköposti autotäydentää sähköpostin vastaanottajan loppuselvitys formista',

  async ({ page, acceptedHakemus, asiatarkastus: { asiatarkastettu } }) => {
    expect(asiatarkastettu)
    let emailSendApiCalled = 0
    const loppuselvitysPage = LoppuselvitysPage(page)

    await page.route('**/loppuselvitys/send', (route) => {
      emailSendApiCalled++
      route.continue()
    })
    await loppuselvitysPage.locators.taloustarkastus.accept.click()
    await loppuselvitysPage.locators.taloustarkastus.confirmAcceptance.click()
    await expect(loppuselvitysPage.locators.taloustarkastus.confirmAcceptance).toBeHidden()
    await expect(loppuselvitysPage.locators.taloustarkastettu).toBeVisible()
    await expect(loppuselvitysPage.locators.taloustarkastus.accept).toBeDisabled()
    await expect(loppuselvitysPage.locators.asiatarkastus.confirmAcceptance).toBeHidden()
    expect(emailSendApiCalled).toEqual(1)
    await loppuselvitysPage.locators.taloustarkastettu.click()
    const lahettaja = page.getByTestId('viesti-details-email-sender')
    await expect(lahettaja).toContainText('no-reply@valtionavustukset.oph.fi')
    const replyTo = page.getByTestId('viesti-details-email-reply-to')
    await expect(replyTo).toContainText('santeri.horttanainen@reaktor.com')
    await expect(
      page.getByText(
        `hakija-1424884@oph.fi, LSyhteyshenkilo@example.com, erkki.esimerkki@example.com`
      )
    ).toBeVisible()

    const loppuselvitysSubmittedEmails = await waitUntilMinEmails(
      getLoppuselvitysSubmittedNotificationEmails,
      1,
      acceptedHakemus.hakemusID
    )
    const loppuSubmittedEmail = loppuselvitysSubmittedEmails[0]
    expect(loppuSubmittedEmail['to-address']).toEqual(
      expect.arrayContaining([
        'erkki.esimerkki@example.com',
        'hakija-1424884@oph.fi',
        'LSyhteyshenkilo@example.com',
      ])
    )
  }
)

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
    await page.getByTestId('taloustarkastus-receiver-2').fill(additionalReceiver)
    await page.getByTestId('taloustarkastus-email-subject').fill(subject)
    await page.getByTestId('taloustarkastus-email-content').fill(content)
    await loppuselvitysPage.locators.taloustarkastus.confirmAcceptance.click()
    await expect(loppuselvitysPage.locators.taloustarkastus.confirmAcceptance).toBeHidden()
    await expect(loppuselvitysPage.locators.taloustarkastettu).toBeVisible()
    await expect(loppuselvitysPage.locators.taloustarkastus.accept).toBeDisabled()
    await expect(loppuselvitysPage.locators.asiatarkastus.confirmAcceptance).toBeHidden()
    expect(emailSendApiCalled).toEqual(1)
  })

  await test.step('and sees which email was sent to hakija afterward', async () => {
    await loppuselvitysPage.locators.taloustarkastettu.click()
    const lahettaja = page.getByTestId('viesti-details-email-sender')
    await expect(lahettaja).toContainText('no-reply@valtionavustukset.oph.fi')
    const replyTo = page.getByTestId('viesti-details-email-reply-to')
    await expect(replyTo).toContainText('santeri.horttanainen@reaktor.com')
    await expect(
      page.getByText(
        `Vastaanottajathakija-1424884@oph.fi, erkki.esimerkki@example.com, ${additionalReceiver}`
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
