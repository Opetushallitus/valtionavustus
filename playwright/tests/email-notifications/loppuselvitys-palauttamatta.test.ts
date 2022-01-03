import { test, expect, Page } from '@playwright/test'
import { HAKIJA_URL, swedishAnswers, VIRKAILIJA_URL } from '../../utils/constants'
import { loppuselvitysTest } from '../../fixtures/loppuselvitysTest'
import { HakujenHallintaPage } from '../../pages/hakujenHallintaPage'
import { getLoppuselvitysPalauttamattaEmails, lastOrFail } from '../../utils/emails'
import moment from 'moment'
import { Answers, MuutoshakemusValues } from '../../utils/types'
import { expectToBeDefined } from '../../utils/util'
import { HakijaMuutoshakemusPage } from '../../pages/hakijaMuutoshakemusPage'
import { HakemustenArviointiPage } from '../../pages/hakemustenArviointiPage'

test.describe("loppuselvitys-palauttamatta", () => {
  loppuselvitysTest('reminder email is not sent for hakemus with loppuselvitys deadline 15 or more days in the future', async ({page, avustushakuID, acceptedHakemus: { hakemusID }, loppuselvityspyyntöSent}) => {
    expectToBeDefined(loppuselvityspyyntöSent)
    const loppuselvitysdate = moment().add(15, 'days').format('DD.MM.YYYY')
    await setLoppuselvitysDate(page, avustushakuID, loppuselvitysdate)

    const emailsBefore = await getLoppuselvitysPalauttamattaEmails(hakemusID)
    await sendLoppuselvitysPalauttamattaNotifications(page)
    const emailsAfter = await getLoppuselvitysPalauttamattaEmails(hakemusID)
    expect(emailsAfter).toEqual(emailsBefore)
  })

  loppuselvitysTest('reminder email is not sent for avustushaku with loppuselvitys deadline in the past', async ({page, avustushakuID, acceptedHakemus: { hakemusID }, loppuselvityspyyntöSent}) => {
    expectToBeDefined(loppuselvityspyyntöSent)
    const loppuselvitysdate = moment().subtract(1, 'days').format('DD.MM.YYYY')
    await setLoppuselvitysDate(page, avustushakuID, loppuselvitysdate)

    const emailsBefore = await getLoppuselvitysPalauttamattaEmails(hakemusID)
    await sendLoppuselvitysPalauttamattaNotifications(page)
    const emailsAfter = await getLoppuselvitysPalauttamattaEmails(hakemusID)
    expect(emailsAfter).toEqual(emailsBefore)
  })

  loppuselvitysTest('reminder email is sent for hakemus with loppuselvitys deadline in next 14 days', async ({page, hakuProps, avustushakuID, acceptedHakemus: { hakemusID, userKey }, loppuselvityspyyntöSent}) => {
    expectToBeDefined(loppuselvityspyyntöSent)
    const loppuselvitysdate = moment().add(14, 'days').format('DD.MM.YYYY')
    await setLoppuselvitysDate(page, avustushakuID, loppuselvitysdate)

    await sendLoppuselvitysPalauttamattaNotifications(page)
    const email = lastOrFail(await getLoppuselvitysPalauttamattaEmails(hakemusID))
    expect(email['to-address']).toHaveLength(1)
    expect(email['to-address']).toContain('erkki.esimerkki@example.com')
    expect(email.subject).toContain("Muistutus loppuselvityksen palauttamisesta")
    expect(email['formatted']).toContain(`Hyvä vastaanottaja,

loppuselvityksenne avustuksessa ${hakuProps.avustushakuName} on palauttamatta.

Muistattehan lähettää loppuselvityksen käsiteltäväksi määräaikaan ${loppuselvitysdate} mennessä. Linkki selvityslomakkeellenne: ${HAKIJA_URL}/avustushaku/${avustushakuID}/loppuselvitys?hakemus=${userKey}&lang=fi

Lisätietoja saatte tarvittaessa avustuspäätöksessä mainitulta lisätietojen antajalta. Teknisissä ongelmissa auttaa: valtionavustukset@oph.fi`)
  })

  loppuselvitysTest.extend<{ answers: Answers }>({
    answers: swedishAnswers,
  })('reminder mail is sent in swedish for swedish hakemus', async ({page, hakuProps, avustushakuID, acceptedHakemus: { hakemusID, userKey }, loppuselvityspyyntöSent}) => {
    expectToBeDefined(loppuselvityspyyntöSent)
    const loppuselvitysdate = moment().add(14, 'days').format('DD.MM.YYYY')
    await setLoppuselvitysDate(page, avustushakuID, loppuselvitysdate)

    await sendLoppuselvitysPalauttamattaNotifications(page)
    const email = lastOrFail(await getLoppuselvitysPalauttamattaEmails(hakemusID))
    expect(email['to-address']).toHaveLength(1)
    expect(email['to-address']).toContain('lars.andersson@example.com')
    expect(email.subject).toContain("Muistutus loppuselvityksen palauttamisesta") // TODO odottaa käännöstä
    expect(email['formatted']).toContain(`Bästa mottagare,

er slutredovisning för användningen av statsunderstödet ${hakuProps.avustushakuName + ' på svenska'} har ännu inte lämnats in.

Kom ihåg att skicka slutredovisningen för behandling inom utsatt tid, senast ${loppuselvitysdate}. Länk till er redovisningsblankett: ${HAKIJA_URL}/avustushaku/${avustushakuID}/loppuselvitys?hakemus=${userKey}&lang=sv

Mera information får ni vid behov av kontaktpersonen som anges i beslutet. Vid tekniska problem, ta kontakt på adressen valtionavustukset@oph.fi”.`)
    })

  loppuselvitysTest('do not send reminders if loppuselvitys pyyntö has not been sent', async ({ page, avustushakuID, acceptedHakemus: { hakemusID }}) => {
    const loppuselvitysdate = moment().add(7, 'days').format('DD.MM.YYYY')
    await setLoppuselvitysDate(page, avustushakuID, loppuselvitysdate)

    const emailsBefore = await getLoppuselvitysPalauttamattaEmails(hakemusID)
    await sendLoppuselvitysPalauttamattaNotifications(page)
    const emailsAfter = await getLoppuselvitysPalauttamattaEmails(hakemusID)
    expect(emailsAfter).toEqual(emailsBefore)
  })

  loppuselvitysTest(
    'does not send reminder if the latest accepted jatkoaika is over 14 days away',
    async ({ page, avustushakuID, acceptedHakemus: { hakemusID }, loppuselvityspyyntöSent}) => {
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
        await hakemustenArviointiPage.navigateToLatestMuutoshakemus(avustushakuID, hakemusID)
        await hakemustenArviointiPage.setMuutoshakemusJatkoaikaDecision('accepted')
        await hakemustenArviointiPage.selectVakioperusteluInFinnish()
        await hakemustenArviointiPage.saveMuutoshakemus()
      }
    })
})

const sendLoppuselvitysPalauttamattaNotifications = (page: Page) =>
  page.request.post(`${VIRKAILIJA_URL}/api/test/send-loppuselvitys-palauttamatta-notifications`, { failOnStatusCode: true })

async function setLoppuselvitysDate(page: Page, avustushakuID: number, value: string) {
  const hakujenHallinta = new HakujenHallintaPage(page)
  await hakujenHallinta.navigateToPaatos(avustushakuID)
  await hakujenHallinta.setLoppuselvitysDate(value)
  await hakujenHallinta.waitForSave()
}