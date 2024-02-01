import { expect, test } from '@playwright/test'
import {
  getLoppuselvitysEmails,
  getLoppuselvitysSubmittedNotificationEmails,
  getSelvitysEmailsWithValiselvitysSubject,
  getValiselvitysEmails,
  getValiselvitysSubmittedNotificationEmails,
  waitUntilMinEmails,
} from '../../utils/emails'
import { selvitysTest } from '../../fixtures/selvitysTest'
import { createJotpaCodes } from '../../fixtures/JotpaTest'
import { Answers } from '../../utils/types'
import { swedishAnswers } from '../../utils/constants'
import { expectToBeDefined } from '../../utils/util'
import { expectIsFinnishJotpaEmail, expectIsSwedishJotpaEmail } from '../../utils/email-signature'
import { ValiselvitysPage } from '../../pages/virkailija/hakujen-hallinta/ValiselvitysPage'

const jotpaSelvitysTest = selvitysTest.extend({
  codes: async ({ page }, use) => {
    const codes = await createJotpaCodes(page)
    await use(codes)
  },
})
const swedishJotpaSelvitysTest = jotpaSelvitysTest.extend<{ answers: Answers }>({
  answers: swedishAnswers,
})

jotpaSelvitysTest(
  'Jotpa hakemus happy path all the way to the loppuselvitys ok',
  async ({
    page,
    avustushakuID,
    acceptedHakemus: { hakemusID },
    valiAndLoppuselvitysSubmitted,
  }) => {
    expectToBeDefined(valiAndLoppuselvitysSubmitted)

    await test.step('Väliselvityksen tarkastus lähettää sähköpostin hakijalle', async () => {
      const valiselvitysPage = ValiselvitysPage(page)
      await valiselvitysPage.navigateToValiselvitysTab(avustushakuID, hakemusID)
      await expect(page.getByTestId('selvitys-email')).toBeVisible()
      await valiselvitysPage.acceptSelvitys()

      const emails = await waitUntilMinEmails(
        getSelvitysEmailsWithValiselvitysSubject,
        1,
        avustushakuID
      )
      const email = emails[0]

      expect(email['to-address']).toEqual(
        expect.arrayContaining(['erkki.esimerkki@example.com', 'akaan.kaupunki@akaa.fi'])
      )
      expect(email.subject).toMatch(/.*Väliselvitys.*käsitelty*/)
      expect(email.formatted).toMatch(/.*Hankkeen.*väliselvitys on käsitelty.*/)
      await expectIsFinnishJotpaEmail(email)
    })

    await test.step('väliselvitys submitted email', async () => {
      const emails = await waitUntilMinEmails(
        getValiselvitysSubmittedNotificationEmails,
        1,
        hakemusID
      )

      await expectIsFinnishJotpaEmail(emails[0])
    })

    await test.step('loppuselvitys submitted email', async () => {
      const emails = await waitUntilMinEmails(
        getLoppuselvitysSubmittedNotificationEmails,
        1,
        hakemusID
      )

      expect(emails[0].formatted).toContain('olemme vastaanottaneet loppuselvityksenne')
      await expectIsFinnishJotpaEmail(emails[0])
    })

    await test.step('Väliselvitys notification', async () => {
      const emails = await waitUntilMinEmails(getValiselvitysEmails, 1, hakemusID)
      await expectIsFinnishJotpaEmail(emails[0])
      expect(emails[0].formatted).toMatch(
        /.*hankkeen.*väliselvityslomake on nyt täytettävissä.*Väliselvityslomake löytyy osoitteesta.*/s
      )
    })

    await test.step('Loppuselvitys notification', async () => {
      const emails = await waitUntilMinEmails(getLoppuselvitysEmails, 1, hakemusID)
      await expectIsFinnishJotpaEmail(emails[0])
      expect(emails[0].formatted).toMatch(
        /.*hankkeen.*loppuselvityslomake on nyt täytettävissä.*Loppuselvityslomake löytyy osoitteesta.*/s
      )
    })
  }
)

swedishJotpaSelvitysTest(
  'Swedish Jotpa hakemus happy path all the way to the loppuselvitys ok',
  async ({
    page,
    avustushakuID,
    acceptedHakemus: { hakemusID },
    valiAndLoppuselvitysSubmitted,
  }) => {
    expectToBeDefined(valiAndLoppuselvitysSubmitted)

    await test.step('Väliselvityksen tarkastus lähettää sähköpostin hakijalle', async () => {
      const valiselvitysPage = ValiselvitysPage(page)
      await valiselvitysPage.navigateToValiselvitysTab(avustushakuID, hakemusID)
      await expect(page.getByTestId('selvitys-email')).toBeVisible()
      await valiselvitysPage.acceptSelvitys()

      const emails = await waitUntilMinEmails(
        getSelvitysEmailsWithValiselvitysSubject,
        1,
        avustushakuID
      )
      const email = emails[0]

      expect(email['to-address']).toEqual(
        expect.arrayContaining(['lars.andersson@example.com', 'akaan.kaupunki@akaa.fi'])
      )
      expect(email.subject).toMatch(/.*Mellanredovisningen .* är behandlad*/)
      expect(email.formatted).toMatch(/.*Mellanredovisningen för projektet .* är behandlad.*/)
      await expectIsSwedishJotpaEmail(email)
    })

    await test.step('väliselvitys submitted email', async () => {
      const emails = await waitUntilMinEmails(
        getValiselvitysSubmittedNotificationEmails,
        1,
        hakemusID
      )

      await expectIsSwedishJotpaEmail(emails[0])
    })

    await test.step('loppuselvitys submitted email', async () => {
      const emails = await waitUntilMinEmails(
        getLoppuselvitysSubmittedNotificationEmails,
        1,
        hakemusID
      )

      expect(emails[0].formatted).toContain('vi har tagit emot er slutredovisning')
      await expectIsSwedishJotpaEmail(emails[0])
    })

    await test.step('Väliselvitys notification', async () => {
      const emails = await waitUntilMinEmails(getValiselvitysEmails, 1, hakemusID)
      await expectIsSwedishJotpaEmail(emails[0])
      expect(emails[0].formatted).toMatch(
        /.*Ni kan nu fylla i blanketten för mellanredovisning för projektet.*Blanketten för mellanredovisning finns på adressen.*/s
      )
    })

    await test.step('Loppuselvitys notification', async () => {
      const emails = await waitUntilMinEmails(getLoppuselvitysEmails, 1, hakemusID)
      await expectIsSwedishJotpaEmail(emails[0])
      expect(emails[0].formatted).toMatch(
        /.*Ni kan nu fylla i blanketten för slutredovisning för projektet.*Blanketten för slutredovisning finns på adressen.*/s
      )
    })
  }
)
