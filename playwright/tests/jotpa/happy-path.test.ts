import { expect, test } from '@playwright/test'
import { getValiselvitysSubmittedNotificationEmails, waitUntilMinEmails } from '../../utils/emails'
import { selvitysTest } from '../../fixtures/selvitysTest'
import { createJotpaCodes } from '../../fixtures/JotpaTest'
import { Answers } from '../../utils/types'
import { swedishAnswers } from '../../utils/constants'
import { expectToBeDefined } from '../../utils/util'

const swedishSignature =
  'Servicecentret för kontinuerligt lärande och sysselsättning\n' +
  'Hagnäskajen 6\n' +
  'PB 380, 00531 Helsingfors\n' +
  'telefon 029 533 1000\n' +
  'fornamn.efternamn@jotpa.fi'

const finnishSignature =
  'Jatkuvan oppimisen ja työllisyyden palvelukeskus\n' +
  'Hakaniemenranta 6\n' +
  'PL 380, 00531 Helsinki\n' +
  'puhelin 029 533 1000\n' +
  'etunimi.sukunimi@jotpa.fi'

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
  async ({ acceptedHakemus: { hakemusID }, valiAndLoppuselvitysSubmitted }) => {
    expectToBeDefined(valiAndLoppuselvitysSubmitted)

    await test.step('väliselvitys email', async () => {
      const emails = await waitUntilMinEmails(
        getValiselvitysSubmittedNotificationEmails,
        1,
        hakemusID
      )

      const email = emails[0]
      expect(email['from-address']).toEqual('no-reply@jotpa.fi')
      expect(email.formatted).toContain(finnishSignature)
    })
  }
)

swedishJotpaSelvitysTest(
  'Swedish Jotpa hakemus happy path all the way to the loppuselvitys ok',
  async ({ acceptedHakemus: { hakemusID }, valiAndLoppuselvitysSubmitted }) => {
    expectToBeDefined(valiAndLoppuselvitysSubmitted)

    await test.step('väliselvitys email', async () => {
      const emails = await waitUntilMinEmails(
        getValiselvitysSubmittedNotificationEmails,
        1,
        hakemusID
      )

      const email = emails[0]
      expect(email['from-address']).toEqual('no-reply@jotpa.fi')
      expect(email.formatted).toContain(swedishSignature)
    })
  }
)
