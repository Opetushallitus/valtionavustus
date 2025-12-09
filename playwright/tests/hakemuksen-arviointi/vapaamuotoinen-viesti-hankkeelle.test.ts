import { expect, test } from '@playwright/test'

import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { muutoshakemusTest } from '../../fixtures/muutoshakemusTest'

// Assumes that the hakemus is first one in avustushaku, so it gets asianumero 1
const message = (content: string, hakuAsianumero: string) =>
  `Hyvä vastaanottaja,

tämä viesti koskee avustusta Rahassa kylpijät Ky Ay Oy (1/${hakuAsianumero}).

${content}

Tarvittaessa tarkempia lisätietoja voi kysyä viestin lähettäjältä.

Ystävällisin terveisin,
_ valtionavustus
santeri.horttanainen@reaktor.com`

const DEFAULT_SUBJECT = 'Viesti Opetushallituksen avustukseen liittyen'

muutoshakemusTest(
  'Vapaamuotoisen viestin lähettäminen hankkeelle',
  async ({ page, answers, avustushakuID, hakuProps, acceptedHakemus }) => {
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    const viestiTab = await hakemustenArviointiPage.navigateToViestiHankkeelleTab(
      avustushakuID,
      acceptedHakemus.hakemusID
    )

    const virkailijaEmailAddress = 'santeri.horttanainen@reaktor.com'
    const form = viestiTab.locators.sendMessageForm
    const message1 = {
      subject: 'Ensimmäinen viesti',
      body: 'Ensimmäisen viestin sisältö',
    }

    await test.step('Viestin täyttäminen', async () => {
      const { addressInputs } = form.recipients
      const replyTo = page.getByTestId('email-form-message-reply-to')
      await expect(replyTo).toHaveValue(virkailijaEmailAddress)
      await expect(addressInputs).toHaveCount(2)
      await expect(addressInputs.nth(0)).toHaveValue('hakija-1424884@oph.fi')
      await expect(addressInputs.nth(1)).toHaveValue(answers.contactPersonEmail)

      await form.subject.fill(message1.subject)
      await form.body.fill(message1.body)
    })

    await test.step('Viestin esikatselu ja lähettäminen', async () => {
      await form.previewButton.click()

      await expect(form.recipients.addButton).not.toBeVisible()
      await expect(form.recipients.addressInputs.nth(0)).toBeDisabled()
      await expect(form.recipients.addressInputs.nth(1)).toBeDisabled()
      await expect(form.subject).toBeDisabled()
      await expect(form.subject).toHaveValue(message1.subject)
      await expect(form.body).toBeDisabled()
      await expect(form.body).toHaveValue(message(message1.body, hakuProps.registerNumber))

      await form.sendButton.click()
      await viestiTab.expectFormIsClear(DEFAULT_SUBJECT)
    })

    await test.step('Lähetetty viesti näkyy listassa', async () => {
      const { messageRows, messageRow } = viestiTab.locators.messageList
      await expect(messageRows).toHaveCount(1)

      const row = messageRows.last()
      await row.click()

      const sender = page.getByTestId('viesti-details-email-sender')
      await expect(sender).toHaveText('no-reply@valtionavustukset.oph.fi')

      const replyTo = page.getByTestId('viesti-details-email-reply-to')
      await expect(replyTo).toHaveText(virkailijaEmailAddress)

      await expect(messageRow.subject(row)).toHaveText(message1.subject)
      await expect(messageRow.recipients(row)).toHaveText(
        `hakija-1424884@oph.fi, ${answers.contactPersonEmail}`
      )
    })

    const message2 = {
      subject: 'Toinen viesti',
      body: 'Toisen viestin sisältö',
    }
    const extraRecipient = 'siiri.saataja@example.com'

    await test.step('Toisen viestin lähettäminen ylimääräisellä vastaanottajalla', async () => {
      const { addressInputs } = form.recipients
      await expect(addressInputs).toHaveCount(2)
      await expect(addressInputs.nth(0)).toHaveValue('hakija-1424884@oph.fi')
      await expect(addressInputs.nth(1)).toHaveValue(answers.contactPersonEmail)

      await form.recipients.addButton.click()
      await form.recipients.addressInputs.last().pressSequentially(extraRecipient)

      await form.subject.fill(message2.subject)
      await form.body.fill(message2.body)

      await form.previewButton.click()
      await form.sendButton.click()
      await viestiTab.expectFormIsClear(DEFAULT_SUBJECT)
    })

    await test.step('Toinen viesti näkyy listassa', async () => {
      const { messageRows, messageRow } = viestiTab.locators.messageList
      await expect(messageRows).toHaveCount(2)

      const row = messageRows.last()
      await row.click()

      await expect(messageRow.recipients(row)).toContainText(answers.contactPersonEmail)
      await expect(messageRow.recipients(row)).toContainText(extraRecipient)
      await expect(messageRow.subject(row)).toHaveText(message2.subject)
    })
  }
)
