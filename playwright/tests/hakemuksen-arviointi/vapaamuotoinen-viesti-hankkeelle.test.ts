import { expect, test } from '@playwright/test'

import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { muutoshakemusTest } from '../../fixtures/muutoshakemusTest'

muutoshakemusTest(
  'Vapaamuotoisen viestin lähettäminen hankkeelle',
  async ({ page, answers, avustushakuID, acceptedHakemus }) => {
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    const viestiTab = await hakemustenArviointiPage.navigateToViestiHankkeelleTab(
      avustushakuID,
      acceptedHakemus.hakemusID
    )

    const form = viestiTab.locators.sendMessageForm
    const message1 = {
      subject: 'Ensimmäinen viesti',
      body: 'Ensimmäisen viestin sisältö',
    }

    await test.step('Viestin lähettäminen', async () => {
      const { addressInputs } = form.recipients
      const sender = page.getByTestId('email-form-message-sender')
      await expect(sender).toHaveValue('no-reply@oph.fi')
      await expect(addressInputs).toHaveCount(1)
      await expect(addressInputs).toHaveValue(answers.contactPersonEmail)

      await form.subject.fill(message1.subject)
      await form.body.fill(message1.body)

      await form.sendButton.click()
      await viestiTab.expectFormIsClear()
    })

    await test.step('Lähetetty viesti näkyy listassa', async () => {
      const { messageRows, messageRow } = viestiTab.locators.messageList
      await expect(messageRows).toHaveCount(1)

      const row = messageRows.last()
      await row.click()

      const sender = page.getByTestId('viesti-details-email-sender')
      await expect(sender).toHaveText('no-reply@valtionavustukset.oph.fi')

      await expect(messageRow.subject(row)).toHaveText(message1.subject)
      await expect(messageRow.recipients(row)).toHaveText(answers.contactPersonEmail)
    })

    const message2 = {
      subject: 'Toinen viesti',
      body: 'Toisen viestin sisältö',
    }
    const extraRecipient = 'siiri.saataja@example.com'

    await test.step('Toisen viestin lähettäminen ylimääräisellä vastaanottajalla', async () => {
      const { addressInputs } = form.recipients
      await expect(addressInputs).toHaveCount(1)
      await expect(addressInputs).toHaveValue(answers.contactPersonEmail)

      await form.recipients.addButton.click()
      await form.recipients.addressInputs.last().type(extraRecipient)

      await form.subject.fill(message2.subject)
      await form.body.fill(message2.body)

      await form.sendButton.click()
      await viestiTab.expectFormIsClear()
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
