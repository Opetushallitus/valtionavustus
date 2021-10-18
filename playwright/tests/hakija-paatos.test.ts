import {svBudjettimuutoshakemusTest as svTest} from "../fixtures/swedishHakemusTest";
import {HakijaPaatosPage} from "../pages/HakijaPaatosPage";
import {expect} from "@playwright/test";
import {
  getAcceptedPäätösEmails,
  getHakemusTokenAndRegisterNumber,
  waitUntilMinEmails
} from "../utils/emails";
import {HAKIJA_URL} from "../utils/constants";

svTest.setTimeout(180000)

svTest('Swedish paatos', async ({page,  hakemus: {hakemusID}}) => {
  const hakijaPaatosPage = new HakijaPaatosPage(page)
  await hakijaPaatosPage.navigate(hakemusID)
  const paatosHeaderTitle = await hakijaPaatosPage.paatosHeaderTitle()
  expect(paatosHeaderTitle?.trim()).toEqual('Beslut')
  expect(await hakijaPaatosPage.paatosTitle()).toEqual('Beslut')
  expect(await hakijaPaatosPage.acceptedTitle()).toEqual('Utbildningsstyrelsen har beslutat att bevilja statsunderstöd till projektet')
  expect(await hakijaPaatosPage.lisatietojaTitle()).toEqual('Mer information')
})

svTest('gets an email in swedish', async ({hakemus: {hakemusID, userKey}, avustushakuID, haku, answers}) => {
  const emails = await waitUntilMinEmails(getAcceptedPäätösEmails, 1, hakemusID)
  const email = emails[emails.length - 1]
  const { token, 'register-number': registerNumber } = await getHakemusTokenAndRegisterNumber(hakemusID)
  expect(email.formatted).toEqual(`${registerNumber} - ${answers.projectName}

${haku.avustushakuName} på svenska

Ni kan granska understödsbeslutet via denna länk: ${HAKIJA_URL}/paatos/avustushaku/${avustushakuID}/hakemus/${userKey}

Understödsmottagaren ska följa de villkor och begränsningar som beskrivs i understödsbeslutet och i dess bilagor.

Om ni tar emot understödet i enlighet med beslutet, kan ni påbörja projektet. Understödsbeloppet betalas senast den dag som anges i beslutet.

Om ni inte tar emot understödet i enlighet med beslutet, ska ni meddela om detta till Utbildningsstyrelsen inom den tidsfrist som anges i beslutet. Anmälan ska göras i statsunderstödssystemet via denna länk: ${HAKIJA_URL}/avustushaku/${avustushakuID}/nayta?avustushaku=${avustushakuID}&hakemus=${userKey}&lang=sv&preview=true&token=${token}&refuse-grant=true&modify-application=false


Om det uppstår förändringar som inverkar på användningen av statsunderstödet ska man genast göra en skriftlig ändringsansökan. Man ska framföra tillräckliga motiveringar för ändringarna som ingår i ändringsansökan. I oklara situationer kan understödsmottagaren vara i kontakt med kontaktpersonen som anges i understödsbeslutet innan en ändringsansökan görs.

Understödsmottagaren ansvarar för att kontaktuppgifterna till den person som angetts som kontaktperson i statsunderstödssystemet alltid är uppdaterade. Ni kan göra en ändringsansökan samt byta ut kontaktpersonen och göra ändringar i hens kontaktuppgifter under hela projektperiodens gång via följande länk:
${HAKIJA_URL}/muutoshakemus?lang=sv&user-key=${userKey}&avustushaku-id=${avustushakuID}

Begäranden om redovisningar och andra meddelanden som riktas till projektet skickas från adressen no-reply@valtionavustukset.oph.fi. De skickas både till projektets kontaktperson och till den officiella e-postadress som den sökande har angett.

Mottagaren av understöd ska spara detta meddelande och länkarna som ingår i meddelandet.

Vid behov ges närmare information av den person som angetts som kontaktperson i understödsbeslutet.

Utbildningsstyrelsen
Hagnäskajen 6
PB 380, 00531 Helsingfors
telefon 029 533 1000
fornamn.efternamn@oph.fi
`)
})
