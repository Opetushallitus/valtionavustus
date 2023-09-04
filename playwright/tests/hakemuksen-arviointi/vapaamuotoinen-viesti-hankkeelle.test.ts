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

      await expect(messageRow.subject(row)).toHaveText(message1.subject)
      await expect(messageRow.recipients(row)).toHaveText(answers.contactPersonEmail)
    })

    await test.step('Toisen viestin lähettäminen', async () => {})

    await test.step('Viestit näkyvät listassa', async () => {})
  }
)
