import { expect } from '@playwright/test'
import { RefusePage } from '../../pages/hakija/refuse-page'
import { getAvustushakuRefusedEmails, waitUntilMinEmails } from '../../utils/emails'
import { twoAcceptedHakemusTest as test } from '../../fixtures/twoHakemusTest'
import { JotpaTest } from '../../fixtures/JotpaTest'
import { expectIsFinnishJotpaEmail } from '../../utils/email-signature'

JotpaTest('Jotpa-avustuksesta kieltäytyminen', async ({ page, acceptedHakemus }, testInfo) => {
  testInfo.setTimeout(testInfo.timeout + 40_000)
  const { hakemusID } = acceptedHakemus

  await test.step('refuse hakemus', async () => {
    const refusePage = RefusePage(page)
    await refusePage.navigate(hakemusID)
    await refusePage.refuseGrant()
  })

  await test.step('Hakija receives correct email', async () => {
    const emails = await waitUntilMinEmails(getAvustushakuRefusedEmails, 1, hakemusID)
    const email = emails[0]
    expect(email.formatted).toContain(
      'Ilmoitus avustuksenne vastaanottamatta jättämisestä on lähetetty Jatkuvan oppimisen ja työllisyyden palvelukeskukselle.'
    )
    await expectIsFinnishJotpaEmail(email)
  })
})
