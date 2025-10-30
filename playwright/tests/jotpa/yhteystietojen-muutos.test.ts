import { expect, test } from '@playwright/test'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import {
  getHakemusTokenAndRegisterNumber,
  getYhteystiedotMuutettuEmails,
  waitUntilMinEmails,
} from '../../utils/emails'
import { JotpaTest, SwedishJotpaTest } from '../../fixtures/JotpaTest'
import { expectIsFinnishJotpaEmail } from '../../utils/email-signature'

JotpaTest(
  'when user changes yhteystiedot',
  async ({ avustushakuID, acceptedHakemus: { hakemusID, userKey }, page }) => {
    const { token } = await getHakemusTokenAndRegisterNumber(hakemusID)
    const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
    const hakemusEditPage = await hakijaAvustusHakuPage.navigateToYhteyshenkilöChangePage(
      avustushakuID,
      userKey,
      token
    )
    await hakemusEditPage.changeHakijaNameToEtunimiTakanimi()
    await expect(page.getByText('Muutokset tallennettu')).toBeVisible()

    const emails = await waitUntilMinEmails(getYhteystiedotMuutettuEmails, 1, hakemusID)
    expect(emails).toHaveLength(1)
    const email = emails[0]

    await test.step('the email has correct sender', async () => {
      expect(email['from-address']).toBe('no-reply@jotpa.fi')
    })

    await test.step('the email has correct body', async () => {
      expect(email.formatted).toContain(
        'Ilmoitus yhteystietojen muutoksesta on lähetetty Jatkuvan oppimisen ja työllisyyden palvelukeskukselle.'
      )

      await expectIsFinnishJotpaEmail(email)
    })
  }
)

SwedishJotpaTest(
  'when swedish user changes yhteystiedot',
  async ({ avustushakuID, acceptedHakemus: { hakemusID, userKey }, page }) => {
    const { token } = await getHakemusTokenAndRegisterNumber(hakemusID)
    const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
    const hakemusEditPage = await hakijaAvustusHakuPage.navigateToYhteyshenkilöChangePage(
      avustushakuID,
      userKey,
      token,
      'sv'
    )
    await hakemusEditPage.changeHakijaNameToEtunimiTakanimi()
    await expect(page.getByText('Ändringarna har sparats')).toBeVisible()

    const emails = await waitUntilMinEmails(getYhteystiedotMuutettuEmails, 1, hakemusID)
    expect(emails).toHaveLength(1)
    const email = emails[0]

    await test.step('the email has correct sender', async () => {
      expect(email['from-address']).toBe('no-reply@jotpa.fi')
    })

    await test.step('the email has correct body', async () => {
      expect(email.formatted).toContain(
        'Anmälan om ändringen till kontaktuppgifterna har skickats till Servicecentret för kontinuerligt lärande och sysselsättning.'
      )

      expect(email.formatted).toContain(
        'Servicecentret för kontinuerligt lärande och sysselsättning\n' +
          'Hagnäskajen 6\n' +
          'PB 380, 00531 Helsingfors\n' +
          'telefon 029 533 1000\n' +
          'fornamn.efternamn@jotpa.fi'
      )
    })
  }
)
