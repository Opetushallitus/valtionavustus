import { expect, test } from '@playwright/test'
import {
  Email,
  getLoppuselvitysEmails,
  getLoppuselvitysSubmittedNotificationEmails,
  getLoppuselvitysTaydennyspyyntoAsiatarkastusEmails,
  getLoppuselvitysTaydennysReceivedHakijaNotificationEmails,
  getSelvitysEmailsWithValiselvitysSubject,
  getTäydennyspyyntöEmails,
  getValiselvitysEmails,
  getValiselvitysSubmittedNotificationEmails,
  waitUntilMinEmails,
} from '../../utils/emails'
import { selvitysTest } from '../../fixtures/selvitysTest'
import { createJotpaCodes } from '../../fixtures/JotpaTest'
import { swedishAnswers } from '../../utils/constants'
import { expectToBeDefined } from '../../utils/util'
import { expectIsFinnishJotpaEmail, expectIsSwedishJotpaEmail } from '../../utils/email-signature'
import { ValiselvitysPage } from '../../pages/virkailija/hakujen-hallinta/ValiselvitysPage'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { Answers } from '../../utils/types'
import { navigate } from '../../utils/navigate'
import { HakijaSelvitysPage } from '../../pages/hakija/hakijaSelvitysPage'

type TaydennyspyyntoFixtures = {
  taydennyspyynto: {
    emails: Email[]
  }
  loppuselvitysTaydennyspyynto: {
    emails: Email[]
  }
  loppuselvitysTaydennyspyyntoVastaus: {
    emails: Email[]
  }
}
const taydennyspyyntoRequestText = 'Tekisikö mieli täydentää masukkia laskiaispullilla?'

const jotpaSelvitysTest = selvitysTest.extend<TaydennyspyyntoFixtures>({
  codes: async ({ page }, use) => {
    const codes = await createJotpaCodes(page)
    await use(codes)
  },
  taydennyspyynto: async ({ page, avustushakuID, submittedHakemus: { userKey } }, use) => {
    expectToBeDefined(userKey)
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    await hakemustenArviointiPage.navigateToLatestHakemusArviointi(avustushakuID)
    const hakemusID = await hakemustenArviointiPage.getHakemusID()
    await hakemustenArviointiPage.createChangeRequest(taydennyspyyntoRequestText)
    const emails = await waitUntilMinEmails(getTäydennyspyyntöEmails, 1, hakemusID)
    await hakemustenArviointiPage.cancelChangeRequest() // we only care about the sent emails
    await use({ emails })
  },
  closedAvustushaku: async ({ closedAvustushaku, taydennyspyynto }, use) => {
    expectToBeDefined(taydennyspyynto)
    return use(closedAvustushaku)
  },
  loppuselvitysTaydennyspyynto: async ({ page, avustushakuID, acceptedHakemus }, use) => {
    const { hakemusID } = acceptedHakemus
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    const loppuselvitysPage = await hakemustenArviointiPage.navigateToHakemusArviointiLoppuselvitys(
      avustushakuID,
      hakemusID
    )
    await loppuselvitysPage.teeLoppuselvityksenTäydennyspyyntö({
      subject: 'Haluutko jotain Mäkistä?',
      body: 'Aattelin käydä siellä töiden jälkeen ja voin tuoda sulle samalla jotain',
    })
    const emails = await waitUntilMinEmails(
      getLoppuselvitysTaydennyspyyntoAsiatarkastusEmails,
      1,
      hakemusID
    )
    await use({ emails })
  },
  loppuselvitysTaydennyspyyntoVastaus: async (
    { page, answers, acceptedHakemus, loppuselvitysSubmitted, loppuselvitysTaydennyspyynto },
    use
  ) => {
    const { hakemusID } = acceptedHakemus
    const { loppuselvitysFormUrl } = loppuselvitysSubmitted
    expectToBeDefined(loppuselvitysTaydennyspyynto)
    await navigate(page, loppuselvitysFormUrl)
    const hakijaSelvitysPage = HakijaSelvitysPage(page, answers.lang)
    await hakijaSelvitysPage.taydennysButton.click()
    const emails = await waitUntilMinEmails(
      getLoppuselvitysTaydennysReceivedHakijaNotificationEmails,
      1,
      hakemusID
    )
    await use({ emails })
  },
})

jotpaSelvitysTest(
  'Jotpa hakemus happy path all the way to the loppuselvitys ok',
  async ({
    page,
    avustushakuID,
    acceptedHakemus: { hakemusID },
    taydennyspyynto,
    valiAndLoppuselvitysSubmitted,
    loppuselvitysTaydennyspyyntoVastaus,
  }) => {
    expectToBeDefined(valiAndLoppuselvitysSubmitted)
    expectToBeDefined(loppuselvitysTaydennyspyyntoVastaus)

    await test.step('Hakija saa Jotpan täydennyspyyntösähköpostin', async () => {
      const email = taydennyspyynto.emails[0]
      expect(email.subject).toBe('Täydennyspyyntö avustushakemukseesi')
      expect(email.formatted).toMatch(new RegExp(`.*${taydennyspyyntoRequestText}.*`))
      await expectIsFinnishJotpaEmail(email)
    })

    await test.step('Hakija saa kuittauksen loppuselvityksen täydennyspyynnön vastauksen saapumisesta', async () => {
      const email = loppuselvitysTaydennyspyyntoVastaus.emails[0]
      expect(email.subject).toMatch(/Organisaationne loppuselvitystä on täydennetty:.*/)
      expect(email.formatted).toMatch(
        /.*Olemme vastaanottaneet loppuselvitystänne koskevat täydennykset ja selvityksenne tarkastus siirtyy seuraavaan vaiheeseen.*/
      )
      await expectIsFinnishJotpaEmail(email)
    })

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
        expect.arrayContaining(['erkki.esimerkki@example.com', 'hakija-1424884@oph.fi'])
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

const swedishJotpaSelvitysTest = jotpaSelvitysTest.extend<{ answers: Answers }>({
  answers: swedishAnswers,
})

swedishJotpaSelvitysTest(
  'Swedish Jotpa hakemus happy path all the way to the loppuselvitys ok',
  async ({
    page,
    avustushakuID,
    acceptedHakemus: { hakemusID },
    taydennyspyynto,
    valiAndLoppuselvitysSubmitted,
    loppuselvitysTaydennyspyyntoVastaus,
  }) => {
    expectToBeDefined(valiAndLoppuselvitysSubmitted)

    await test.step('Hakija saa Jotpan täydennyspyyntösähköpostin', async () => {
      const email = taydennyspyynto.emails[0]
      expect(email.subject).toBe('Begäran om komplettering av ansökan')
      expect(email.formatted).toMatch(new RegExp(`.*${taydennyspyyntoRequestText}.*`))
      await expectIsSwedishJotpaEmail(email)
    })

    await test.step('Hakija saa kuittauksen loppuselvityksen täydennyspyynnön vastauksen saapumisesta', async () => {
      const email = loppuselvitysTaydennyspyyntoVastaus.emails[0]
      expect(email.subject).toMatch(/Slutredovisningen för er organisation är kompletterad:.*/)
      expect(email.formatted).toMatch(
        /.*Vi har tagit emot kompletteringarna till er slutredovisning och den går nu vidare till nästa skede av granskningen.*/
      )
      await expectIsSwedishJotpaEmail(email)
    })

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
        expect.arrayContaining(['lars.andersson@example.com', 'hakija-1424884@oph.fi'])
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
