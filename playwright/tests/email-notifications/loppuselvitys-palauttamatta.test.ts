import { test, expect, Page } from '@playwright/test'
import { HAKIJA_URL, swedishAnswers, VIRKAILIJA_URL } from '../../utils/constants'
import { getLoppuselvitysPalauttamattaEmails, waitUntilMinEmails } from '../../utils/emails'
import moment from 'moment'
import { Answers, MuutoshakemusValues } from '../../utils/types'
import { expectToBeDefined } from '../../utils/util'
import { HakijaMuutoshakemusPage } from '../../pages/hakija/hakijaMuutoshakemusPage'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { selvitysTest } from '../../fixtures/selvitysTest'
import { PaatosPage } from '../../pages/virkailija/hakujen-hallinta/PaatosPage'
import {
  expectIsFinnishJotpaEmail,
  expectIsFinnishOphEmail,
  expectIsSwedishJotpaEmail,
  expectIsSwedishOphEmail,
} from '../../utils/email-signature'
import { createJotpaCodes } from '../../fixtures/JotpaTest'

selvitysTest.describe('loppuselvitys-palauttamatta', () => {
  selvitysTest(
    'reminder email is not sent for hakemus with loppuselvitys deadline 15 or more days in the future',
    async ({ page, avustushakuID, acceptedHakemus: { hakemusID }, loppuselvityspyyntöSent }) => {
      expectToBeDefined(loppuselvityspyyntöSent)
      const loppuselvitysdate = moment().add(15, 'days').format('DD.MM.YYYY')
      await setLoppuselvitysDate(page, avustushakuID, loppuselvitysdate)

      const emailsBefore = await getLoppuselvitysPalauttamattaEmails(hakemusID)
      await sendLoppuselvitysPalauttamattaNotifications(page)
      const emailsAfter = await getLoppuselvitysPalauttamattaEmails(hakemusID)
      expect(emailsAfter).toEqual(emailsBefore)
    }
  )

  selvitysTest(
    'reminder email is not sent for avustushaku with loppuselvitys deadline in the past',
    async ({ page, avustushakuID, acceptedHakemus: { hakemusID }, loppuselvityspyyntöSent }) => {
      expectToBeDefined(loppuselvityspyyntöSent)
      const loppuselvitysdate = moment().subtract(1, 'days').format('DD.MM.YYYY')
      await setLoppuselvitysDate(page, avustushakuID, loppuselvitysdate)

      const emailsBefore = await getLoppuselvitysPalauttamattaEmails(hakemusID)
      await sendLoppuselvitysPalauttamattaNotifications(page)
      const emailsAfter = await getLoppuselvitysPalauttamattaEmails(hakemusID)
      expect(emailsAfter).toEqual(emailsBefore)
    }
  )

  selvitysTest(
    'reminder email is sent once for hakemus with loppuselvitys deadline in next 14 days',
    async ({
      page,
      answers,
      hakuProps,
      avustushakuID,
      acceptedHakemus: { hakemusID, userKey },
      loppuselvityspyyntöSent,
    }) => {
      expectToBeDefined(loppuselvityspyyntöSent)
      const loppuselvitysdate = moment().add(14, 'days').format('DD.MM.YYYY')
      await setLoppuselvitysDate(page, avustushakuID, loppuselvitysdate)
      await sendLoppuselvitysPalauttamattaNotifications(page)

      await test.step('reminder is sent', async () => {
        const emails = await waitUntilMinEmails(getLoppuselvitysPalauttamattaEmails, 1, hakemusID)
        expect(emails).toHaveLength(1)
        const email = emails[0]
        expect(email['to-address']).toHaveLength(2)
        expect(email['to-address']).toContain(answers.contactPersonEmail)
        expect(email['to-address']).toContain('hakija-1424884@oph.fi')
        await expectIsFinnishOphEmail(email)
        expect(email.subject).toContain('Muistutus loppuselvityksen palauttamisesta')
        expect(email['formatted']).toContain(`Hyvä vastaanottaja,

loppuselvityksenne avustuksessa ${hakuProps.avustushakuName} on palauttamatta.

Muistattehan lähettää loppuselvityksen käsiteltäväksi määräaikaan ${loppuselvitysdate} mennessä.

Käyttöajan pidennystä saaneiden hankkeiden määräaika voi poiketa edellä kuvatusta. Käyttöajan pidennystä saaneiden hankkeiden selvitysaikataulu kuvataan päätöksessä, joka on annettu muutoshakemukseennne.

Mikäli käyttöajan pidennystä saaneelle hankkeelle ei ole erikseen annettu uutta määräaikaa, tulee loppuselvitys palauttaa kahden kuukauden kuluessa käyttöajan pidennyksen päättymisestä.

Linkki selvityslomakkeellenne: ${HAKIJA_URL}/avustushaku/${avustushakuID}/loppuselvitys?hakemus=${userKey}&lang=fi

Lisätietoja saatte tarvittaessa avustuspäätöksessä mainitulta lisätietojen antajalta. Teknisissä ongelmissa auttaa: valtionavustukset@oph.fi`)
      })

      await test.step('reminder is not sent again', async () => {
        await sendLoppuselvitysPalauttamattaNotifications(page)
        const emailsAfterSecondSend = await getLoppuselvitysPalauttamattaEmails(hakemusID)
        expect(emailsAfterSecondSend).toHaveLength(1)
      })
    }
  )

  selvitysTest(
    'reminder email is not sent when loppuselvitys is submitted',
    async ({ page, avustushakuID, acceptedHakemus: { hakemusID }, loppuselvitysSubmitted }) => {
      expectToBeDefined(loppuselvitysSubmitted)

      const loppuselvitysdate = moment().add(14, 'days').format('DD.MM.YYYY')
      await setLoppuselvitysDate(page, avustushakuID, loppuselvitysdate)

      const emailsBefore = await getLoppuselvitysPalauttamattaEmails(hakemusID)
      await sendLoppuselvitysPalauttamattaNotifications(page)
      const emailsAfter = await getLoppuselvitysPalauttamattaEmails(hakemusID)
      expect(emailsAfter).toEqual(emailsBefore)
    }
  )

  selvitysTest(
    'do not send reminders if loppuselvitys pyyntö has not been sent',
    async ({ page, avustushakuID, acceptedHakemus: { hakemusID } }) => {
      const loppuselvitysdate = moment().add(7, 'days').format('DD.MM.YYYY')
      await setLoppuselvitysDate(page, avustushakuID, loppuselvitysdate)

      const emailsBefore = await getLoppuselvitysPalauttamattaEmails(hakemusID)
      await sendLoppuselvitysPalauttamattaNotifications(page)
      const emailsAfter = await getLoppuselvitysPalauttamattaEmails(hakemusID)
      expect(emailsAfter).toEqual(emailsBefore)
    }
  )

  selvitysTest(
    'does not send reminder if the latest accepted jatkoaika is over 14 days away',
    async ({ page, avustushakuID, acceptedHakemus: { hakemusID }, loppuselvityspyyntöSent }) => {
      expectToBeDefined(loppuselvityspyyntöSent)

      await test.step('set loppuselvitys deadline', async () => {
        const loppuselvitysdate = moment().add(1, 'days').format('DD.MM.YYYY')
        await setLoppuselvitysDate(page, avustushakuID, loppuselvitysdate)
      })

      await test.step('apply for jatkoaika 5 days in the future', async () => {
        await applyAndAcceptJatkoaika({
          jatkoaika: moment().add(5, 'days'),
          jatkoaikaPerustelu: 'Ge mig lite mera tid, tack!',
        })
      })

      await test.step('apply for jatkoaika 100 years in the future', async () => {
        await applyAndAcceptJatkoaika({
          jatkoaika: moment().add(100, 'years'),
          jatkoaikaPerustelu: 'Javisst ska hen leva uti hundrade år!',
        })
      })

      await test.step('check reminder email is not sent', async () => {
        const emailsBefore = await getLoppuselvitysPalauttamattaEmails(hakemusID)
        await sendLoppuselvitysPalauttamattaNotifications(page)
        const emailsAfter = await getLoppuselvitysPalauttamattaEmails(hakemusID)
        expect(emailsAfter).toEqual(emailsBefore)
      })

      async function applyAndAcceptJatkoaika(values: MuutoshakemusValues) {
        const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page)
        await hakijaMuutoshakemusPage.navigate(hakemusID)
        await hakijaMuutoshakemusPage.fillJatkoaikaValues(values)
        await hakijaMuutoshakemusPage.clickSendMuutoshakemus()
        await hakijaMuutoshakemusPage.expectMuutoshakemusToBeSubmittedSuccessfully(true)

        const hakemustenArviointiPage = new HakemustenArviointiPage(page)
        const muutoshakemusTab = await hakemustenArviointiPage.navigateToLatestMuutoshakemus(
          avustushakuID,
          hakemusID
        )
        await muutoshakemusTab.setMuutoshakemusJatkoaikaDecision('accepted')
        await muutoshakemusTab.selectVakioperusteluInFinnish()
        await muutoshakemusTab.saveMuutoshakemus()
      }
    }
  )
})

const swedishLoppuselvitysTest = selvitysTest.extend<{ answers: Answers }>({
  answers: swedishAnswers,
})

swedishLoppuselvitysTest(
  'reminder mail is sent in swedish for swedish hakemus',
  async ({
    page,
    hakuProps,
    avustushakuID,
    acceptedHakemus: { hakemusID, userKey },
    loppuselvityspyyntöSent,
  }) => {
    expectToBeDefined(loppuselvityspyyntöSent)
    const loppuselvitysdate = moment().add(14, 'days').format('DD.MM.YYYY')
    await setLoppuselvitysDate(page, avustushakuID, loppuselvitysdate)

    await sendLoppuselvitysPalauttamattaNotifications(page)
    const emails = await waitUntilMinEmails(getLoppuselvitysPalauttamattaEmails, 1, hakemusID)
    const email = emails[0]
    expect(email['to-address']).toHaveLength(2)
    expect(email['to-address']).toContain('lars.andersson@example.com')
    expect(email['to-address']).toContain('hakija-1424884@oph.fi')
    await expectIsSwedishOphEmail(email)
    expect(email.subject).toContain('Påminnelse om att lämna in slutredovisningen')
    expect(email['formatted']).toContain(`Bästa mottagare,

er slutredovisning för användningen av statsunderstödet ${
      hakuProps.avustushakuName + ' på svenska'
    } har ännu inte lämnats in.

Kom ihåg att skicka slutredovisningen för behandling inom utsatt tid, senast ${loppuselvitysdate}.

Projekt som har beviljats förlängd användningstid för understödet kan ha en sista inlämningsdag för slutredovisningen som avviker från vad som nämns ovan. Den sista inlämningsdagen för redovisningar inom projekt som beviljats förlängd användningstid anges i beslutet som fattats utifrån en ändringsansökan.

Om ett projekt som beviljats förlängd användningstid inte har fått en ny tidsfrist för redovisningen, ska slutredovisningen lämnas in inom två månader efter att den förlängda användningstiden har gått ut.

Länk till er redovisningsblankett: ${HAKIJA_URL}/avustushaku/${avustushakuID}/loppuselvitys?hakemus=${userKey}&lang=sv

Mera information får ni vid behov av kontaktpersonen som anges i beslutet. Vid tekniska problem, ta kontakt på adressen valtionavustukset@oph.fi`)
  }
)

const jotpaLoppuselvitysTest = selvitysTest.extend({
  codes: async ({ page }, use) => {
    const codes = await createJotpaCodes(page)
    await use(codes)
  },
})

jotpaLoppuselvitysTest.describe('Jotpan loppuselvitys palauttamatta', () => {
  jotpaLoppuselvitysTest(
    'Jotpa reminder email is sent once for hakemus with loppuselvitys deadline in next 14 days',
    async ({
      page,
      answers,
      hakuProps,
      avustushakuID,
      acceptedHakemus: { hakemusID, userKey },
      loppuselvityspyyntöSent,
    }) => {
      expectToBeDefined(loppuselvityspyyntöSent)
      const loppuselvitysdate = moment().add(14, 'days').format('DD.MM.YYYY')
      await setLoppuselvitysDate(page, avustushakuID, loppuselvitysdate)
      await sendLoppuselvitysPalauttamattaNotifications(page)

      await test.step('reminder is sent', async () => {
        const emails = await waitUntilMinEmails(getLoppuselvitysPalauttamattaEmails, 1, hakemusID)
        expect(emails).toHaveLength(1)
        const email = emails[0]
        expect(email['to-address']).toHaveLength(2)
        expect(email['to-address']).toContain(answers.contactPersonEmail)
        expect(email['to-address']).toContain('hakija-1424884@oph.fi')
        await expectIsFinnishJotpaEmail(email)
        expect(email.subject).toContain('Muistutus loppuselvityksen palauttamisesta')
        expect(email['formatted']).toContain(`Hyvä vastaanottaja,

loppuselvityksenne avustuksessa ${hakuProps.avustushakuName} on palauttamatta.

Muistattehan lähettää loppuselvityksen käsiteltäväksi määräaikaan ${loppuselvitysdate} mennessä.

Käyttöajan pidennystä saaneiden hankkeiden määräaika voi poiketa edellä kuvatusta. Käyttöajan pidennystä saaneiden hankkeiden selvitysaikataulu kuvataan päätöksessä, joka on annettu muutoshakemukseennne.

Mikäli käyttöajan pidennystä saaneelle hankkeelle ei ole erikseen annettu uutta määräaikaa, tulee loppuselvitys palauttaa kahden kuukauden kuluessa käyttöajan pidennyksen päättymisestä.

Linkki selvityslomakkeellenne: ${HAKIJA_URL}/avustushaku/${avustushakuID}/loppuselvitys?hakemus=${userKey}&lang=fi

Lisätietoja saatte tarvittaessa avustuspäätöksessä mainitulta lisätietojen antajalta. Teknisissä ongelmissa auttaa: valtionavustukset@oph.fi`)
      })
    }
  )
})

const swedishJotpaLoppuselvitysTest = selvitysTest.extend<{ answers: Answers }>({
  answers: swedishAnswers,
  codes: async ({ page }, use) => {
    const codes = await createJotpaCodes(page)
    await use(codes)
  },
})

swedishJotpaLoppuselvitysTest(
  'Jotpa reminder mail is sent in swedish for swedish hakemus',
  async ({
    page,
    hakuProps,
    avustushakuID,
    acceptedHakemus: { hakemusID, userKey },
    loppuselvityspyyntöSent,
  }) => {
    expectToBeDefined(loppuselvityspyyntöSent)
    const loppuselvitysdate = moment().add(14, 'days').format('DD.MM.YYYY')
    await setLoppuselvitysDate(page, avustushakuID, loppuselvitysdate)

    await sendLoppuselvitysPalauttamattaNotifications(page)
    const emails = await waitUntilMinEmails(getLoppuselvitysPalauttamattaEmails, 1, hakemusID)
    const email = emails[0]
    expect(email['to-address']).toHaveLength(2)
    expect(email['to-address']).toContain('lars.andersson@example.com')
    expect(email['to-address']).toContain('hakija-1424884@oph.fi')
    await expectIsSwedishJotpaEmail(email)
    expect(email.subject).toContain('Påminnelse om att lämna in slutredovisningen')
    expect(email['formatted']).toContain(`Bästa mottagare,

er slutredovisning för användningen av statsunderstödet ${
      hakuProps.avustushakuName + ' på svenska'
    } har ännu inte lämnats in.

Kom ihåg att skicka slutredovisningen för behandling inom utsatt tid, senast ${loppuselvitysdate}.

Projekt som har beviljats förlängd användningstid för understödet kan ha en sista inlämningsdag för slutredovisningen som avviker från vad som nämns ovan. Den sista inlämningsdagen för redovisningar inom projekt som beviljats förlängd användningstid anges i beslutet som fattats utifrån en ändringsansökan.

Om ett projekt som beviljats förlängd användningstid inte har fått en ny tidsfrist för redovisningen, ska slutredovisningen lämnas in inom två månader efter att den förlängda användningstiden har gått ut.

Länk till er redovisningsblankett: ${HAKIJA_URL}/avustushaku/${avustushakuID}/loppuselvitys?hakemus=${userKey}&lang=sv

Mera information får ni vid behov av kontaktpersonen som anges i beslutet. Vid tekniska problem, ta kontakt på adressen valtionavustukset@oph.fi`)
  }
)

const sendLoppuselvitysPalauttamattaNotifications = (page: Page) =>
  page.request.post(`${VIRKAILIJA_URL}/api/test/send-loppuselvitys-palauttamatta-notifications`, {
    failOnStatusCode: true,
  })

async function setLoppuselvitysDate(page: Page, avustushakuID: number, value: string) {
  const paatosPage = PaatosPage(page)
  await paatosPage.navigateTo(avustushakuID)
  await paatosPage.setLoppuselvitysDate(value)
  await paatosPage.waitForSave()
}
