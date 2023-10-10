import { Locator, expect } from '@playwright/test'
import { clearAndType } from '../../../utils/util'
import { selvitysTest as test } from '../../../fixtures/selvitysTest'
import SelvitysTab from '../../../pages/virkailija/hakujen-hallinta/CommonSelvitysPage'
import { getLoppuselvitysMuistutusviestiEmails, waitUntilMinEmails } from '../../../utils/emails'
import moment from 'moment'

test('virkailija can send muistutusviesti for loppuselvitys', async ({
  page,
  answers,
  acceptedHakemus: { hakemusID },
  avustushakuID,
}) => {
  const subject = 'Akaan kaupungin loppuselvitys muistutus'
  const content = 'Hei! Muistattehan täyttää kaikki kentät?'
  const additionalReceiver = 'karri@kojootti.dog'

  await test.step('virkailija can fill and submit muistutusviesti form', async () => {
    await SelvitysTab(page, 'loppu').navigateToLoppuselvitysTab(avustushakuID, hakemusID)

    await page.getByRole('button', { name: 'Kirjoita' }).click()
    const form = page.getByTestId('muistutusviesti-email').locator('form')

    await expect(isValid(form), 'Unfilled form should be invalid').resolves.toBe(false)
    await page.click('[data-test-id="muistutusviesti-add-receiver"]')
    await clearAndType(page, '[data-test-id="muistutusviesti-receiver-1"]', additionalReceiver)

    await clearAndType(page, '[data-test-id="muistutusviesti-email-subject"]', subject)
    await expect(
      isValid(form),
      'Filling just subject should not make the form valid'
    ).resolves.toBe(false)
    await clearAndType(page, '[data-test-id="muistutusviesti-email-content"]', content)
    await expect(
      isValid(form),
      'Form should be valid after filling subject and content'
    ).resolves.toBe(true)
    await page.getByRole('button', { name: 'Lähetä muistutusviesti' }).click()
  })

  await test.step('muistutusviesti email is sent', async () => {
    const emails = await waitUntilMinEmails(getLoppuselvitysMuistutusviestiEmails, 1, hakemusID)
    expect(emails).toHaveLength(1)

    const email = emails[0]
    expect(email.subject).toEqual(subject)
    expect(email.formatted).toEqual(content)
    expect(email.bcc).toBeNull()
    expect(email.cc).toEqual([])
    expect(email['reply-to']).toBe(null)

    const { contactPersonEmail } = answers
    expect(email['to-address']).toEqual([contactPersonEmail, additionalReceiver])
  })

  await test.step('sent muistutusviesti is shown in list', async () => {
    await expect(
      page.getByTestId('hakemus-details-loppuselvitys').getByText(formatDate(new Date()))
    ).toBeVisible()
    await page.getByTestId('open-email-0').click()
    await expect(
      page.getByText('Vastaanottajaterkki.esimerkki@example.com, karri@kojootti.dog')
    ).toBeVisible()
    await expect(page.getByText(`Aihe${subject}`)).toBeVisible()
    await expect(page.getByText(content)).toBeVisible()
  })
})

moment.locale('fi')

const formatDate = (date: Date) => {
  return `${moment(date).format('DD.MM.YYYY')}`
}
function isValid(locator: Locator): Promise<boolean> {
  return locator.evaluate((elem: HTMLFormElement) => elem.checkValidity())
}
