import { expect } from '@playwright/test'
import { RefusePage } from '../../pages/hakija/refuse-page'
import { getAvustushakuRefusedEmails, waitUntilMinEmails } from '../../utils/emails'
import { twoAcceptedHakemusTest as test } from '../../fixtures/twoHakemusTest'
import { JotpaTest } from '../../fixtures/JotpaTest'

JotpaTest('Jotpa-avustuksesta kieltäytyminen', async ({ page, acceptedHakemus }, testInfo) => {
  testInfo.setTimeout(testInfo.timeout + 40_000)
  const { hakemusID } = acceptedHakemus

  await test.step('refuse hakemus', async () => {
    const refusePage = RefusePage(page)
    await refusePage.navigate(hakemusID)
    await refusePage.refuseGrant()
  })

  await test.step('Hakija receives email', async () => {
    const emails = await waitUntilMinEmails(getAvustushakuRefusedEmails, 1, hakemusID)
    const email = emails[0]

    await test.step('with correct body', async () => {
      expect(email.formatted).toContain(
        'Ilmoitus avustuksenne vastaanottamatta jättämisestä on lähetetty Jatkuvan oppimisen ja työllisyyden palvelukeskukselle.'
      )

      expect(email.formatted).toContain(
        'Jatkuvan oppimisen ja työllisyyden palvelukeskus\n' +
          'Hakaniemenranta 6\n' +
          'PL 380, 00531 Helsinki\n' +
          'puhelin 029 533 1000\n' +
          'etunimi.sukunimi@jotpa.fi'
      )
    })

    await test.step('with correct from-address', async () => {
      expect(email['from-address']).toBe('no-reply@jotpa.fi')
    })
  })
})
