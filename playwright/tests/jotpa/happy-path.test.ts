import { expect, test } from '@playwright/test'
import {
  getLoppuselvitysEmails,
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
  async ({ acceptedHakemus: { hakemusID }, valiAndLoppuselvitysSubmitted }) => {
    expectToBeDefined(valiAndLoppuselvitysSubmitted)

    await test.step('väliselvitys email', async () => {
      const emails = await waitUntilMinEmails(
        getValiselvitysSubmittedNotificationEmails,
        1,
        hakemusID
      )

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
