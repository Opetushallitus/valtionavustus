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
      await expect(viestiTab.getRecipients(), 'yhteyshenkilö on vastaanottajana').resolves.toEqual([
        answers.contactPersonEmail,
      ])

      await form.subject.fill(message1.subject)
      await form.body.fill(message1.body)

      await form.sendButton.click()
      await viestiTab.expectFormIsClear()
    })

    await test.step('Lähetetty viesti näkyy listassa', async () => {})

    await test.step('Toisen viestin lähettäminen', async () => {})

    await test.step('Viestit näkyvät listassa', async () => {})
  }
)
