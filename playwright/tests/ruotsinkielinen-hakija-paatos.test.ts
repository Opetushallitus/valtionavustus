import { svBudjettimuutoshakemusTest as svTest } from '../fixtures/swedishHakemusTest'
import { HakijaPaatosPage } from '../pages/hakija/HakijaPaatosPage'
import { expect, test } from '@playwright/test'
import {
  getAcceptedPäätösEmails,
  getHakemusTokenAndRegisterNumber,
  waitUntilMinEmails,
} from '../utils/emails'
import { HAKIJA_URL } from '../utils/constants'

svTest.setTimeout(180000)

svTest.extend({
  avustushakuName: async ({}, use) => await use('Svenska applikantten hufvud testen'),
  hakuProps: async ({ hakuProps }, use) => {
    await use({
      ...hakuProps,
      registerNumber: '6/69',
    })
  },
})(
  'When avustushaku has been created and swedish hakemus has been submitted and approved',
  async ({ page, acceptedHakemus: { hakemusID, userKey }, answers, avustushakuID, hakuProps }) => {
    await test.step('hakija gets an email in swedish', async () => {
      const emails = await waitUntilMinEmails(getAcceptedPäätösEmails, 1, hakemusID)
      const email = emails[emails.length - 1]
      const { token, 'register-number': registerNumber } =
        await getHakemusTokenAndRegisterNumber(hakemusID)
      expect(email.formatted).toEqual(`${registerNumber} - ${answers.projectName}

${hakuProps.avustushakuName} på svenska

Ni kan granska understödsbeslutet via denna länk: ${HAKIJA_URL}/paatos/avustushaku/${avustushakuID}/hakemus/${userKey}

Understödsmottagaren ska följa de villkor och begränsningar som beskrivs i understödsbeslutet och i dess bilagor.

Om ni tar emot understödet i enlighet med beslutet, kan ni påbörja projektet. Understödsbeloppet betalas senast den dag som anges i beslutet.

Om ni inte tar emot understödet i enlighet med beslutet, ska ni meddela om detta till Utbildningsstyrelsen inom den tidsfrist som anges i beslutet. Anmälan ska göras i statsunderstödssystemet via denna länk: ${HAKIJA_URL}/avustushaku/${avustushakuID}/nayta?avustushaku=${avustushakuID}&hakemus=${userKey}&lang=sv&preview=true&token=${token}&refuse-grant=true&modify-application=false


Om det uppstår förändringar som inverkar på användningen av statsunderstödet ska man genast göra en skriftlig ändringsansökan. Man ska framföra tillräckliga motiveringar för ändringarna som ingår i ändringsansökan. I oklara situationer kan understödsmottagaren vara i kontakt med kontaktpersonen som anges i understödsbeslutet innan en ändringsansökan görs.

Understödsmottagaren ansvarar för att kontaktuppgifterna till den person som angetts som kontaktperson i statsunderstödssystemet alltid är uppdaterade. Ni kan göra en ändringsansökan samt byta ut kontaktpersonen och göra ändringar i hens kontaktuppgifter under hela projektperiodens gång via följande länk:
${HAKIJA_URL}/muutoshakemus?lang=sv&user-key=${userKey}&avustushaku-id=${avustushakuID}

Begäranden om redovisningar och andra meddelanden som riktas till projektet skickas från adressen no-reply@statsunderstod.oph.fi. De skickas både till projektets kontaktperson och till den officiella e-postadress som den sökande har angett.

Mottagaren av understöd ska spara detta meddelande och länkarna som ingår i meddelandet.

Vid behov ges närmare information av den person som angetts som kontaktperson i understödsbeslutet.



Utbildningsstyrelsen
Hagnäskajen 6
PB 380, 00531 Helsingfors
telefon 029 533 1000
fornamn.efternamn@oph.fi
`)
    })
    const hakijaPaatosPage = HakijaPaatosPage(page)
    await test.step('hakija navigates to päätös', async () => {
      await hakijaPaatosPage.navigate(hakemusID)
    })
    await test.step('päätös header title is in swedish', async () => {
      await expect(hakijaPaatosPage.paatosHeaderTitle).toHaveText('Beslut')
    })
    await test.step('päätös header title is in swedish', async () => {
      await expect(hakijaPaatosPage.paatosHeaderTitle).toHaveText('Beslut')
    })
    await test.step('päätös title is in swedish', async () => {
      await expect(hakijaPaatosPage.paatosTitle).toHaveText('Beslut')
    })
    await test.step('päätös accepted title is in swedish', async () => {
      await expect(hakijaPaatosPage.acceptedTitle).toHaveText(
        'Utbildningsstyrelsen har beslutat att bevilja statsunderstöd till projektet'
      )
    })
    await test.step('lisätietoja title is in swedish', async () => {
      await expect(hakijaPaatosPage.lisatietojaTitle).toHaveText('Mer information')
    })
    await test.step('avustuslaji is in swedish', async () => {
      await expect(hakijaPaatosPage.avustuslajiTitle).toHaveText('Typ av statsunderstöd')
      await expect(hakijaPaatosPage.avustuslaji).toHaveText('Specialunderstöd')
    })
    await test.step('swedish paatos matches snapshot', async () => {
      await expect(page).toHaveScreenshot({
        fullPage: true,
        maxDiffPixelRatio: 0.05,
      })
    })
  }
)
