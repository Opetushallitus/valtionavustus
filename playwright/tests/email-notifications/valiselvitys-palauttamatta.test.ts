import { test, expect, Page } from '@playwright/test'
import moment from 'moment'

import { HAKIJA_URL, swedishAnswers, VIRKAILIJA_URL } from '../../utils/constants'
import { getValiselvitysPalauttamattaEmails, lastOrFail } from '../../utils/emails'
import { Answers } from '../../utils/types'
import { expectToBeDefined } from '../../utils/util'
import { selvitysTest } from '../../fixtures/selvitysTest'
import { PaatosPage } from '../../pages/hakujen-hallinta/PaatosPage'

test.describe('valiselvitys-palauttamatta', () => {
  selvitysTest(
    'reminder in Finnish',
    async ({
      page,
      hakuProps,
      avustushakuID,
      acceptedHakemus: { hakemusID, userKey },
      väliselvityspyyntöSent,
    }) => {
      expectToBeDefined(väliselvityspyyntöSent)

      await test.step('is not sent for hakemus with valiselvitys deadline 15 or more days in the future', async () => {
        const valiselvitysdate = moment().add(15, 'days').format('DD.MM.YYYY')
        await setValiselvitysDate(page, avustushakuID, valiselvitysdate)

        const emailsBefore = await getValiselvitysPalauttamattaEmails(hakemusID)
        await sendValiselvitysPalauttamattaNotifications(page)
        const emailsAfter = await getValiselvitysPalauttamattaEmails(hakemusID)
        expect(emailsAfter).toEqual(emailsBefore)
      })

      await test.step('is not sent for hakemus with valiselvitys deadline in the past', async () => {
        const valiselvitysdate = moment().subtract(1, 'days').format('DD.MM.YYYY')
        await setValiselvitysDate(page, avustushakuID, valiselvitysdate)

        const emailsBefore = await getValiselvitysPalauttamattaEmails(hakemusID)
        await sendValiselvitysPalauttamattaNotifications(page)
        const emailsAfter = await getValiselvitysPalauttamattaEmails(hakemusID)
        expect(emailsAfter).toEqual(emailsBefore)
      })

      await test.step('is sent for hakemus with valiselvitys deadline in next 14 days', async () => {
        const valiselvitysdate = moment().add(14, 'days').format('DD.MM.YYYY')
        await setValiselvitysDate(page, avustushakuID, valiselvitysdate)

        await sendValiselvitysPalauttamattaNotifications(page)
        const email = lastOrFail(await getValiselvitysPalauttamattaEmails(hakemusID))
        expect(email['to-address']).toHaveLength(1)
        expect(email['to-address']).toContain('erkki.esimerkki@example.com')
        expect(email.subject).toContain('Muistutus väliselvityksen palauttamisesta')
        expect(email['formatted']).toContain(`Hyvä vastaanottaja,

Väliselvityksenne avustuksessa ${hakuProps.avustushakuName} on palauttamatta.

Muistattehan lähettää väliselvityksen käsiteltäväksi määräaikaan ${valiselvitysdate} mennessä. Linkki selvityslomakkeellenne: ${HAKIJA_URL}/avustushaku/${avustushakuID}/valiselvitys?hakemus=${userKey}&lang=fi

Lisätietoja saatte tarvittaessa avustuspäätöksessä mainitulta lisätietojen antajalta. Teknisissä ongelmissa auttaa: valtionavustukset@oph.fi`)
      })

      await test.step('is sent only once', async () => {
        const emailsBefore = await getValiselvitysPalauttamattaEmails(hakemusID)
        await sendValiselvitysPalauttamattaNotifications(page)
        const emailsAfter = await getValiselvitysPalauttamattaEmails(hakemusID)
        expect(emailsAfter).toEqual(emailsBefore)
      })
    }
  )

  selvitysTest(
    'reminder email is not sent when valiselvitys is submitted',
    async ({ page, avustushakuID, acceptedHakemus: { hakemusID }, väliselvitysSubmitted }) => {
      expectToBeDefined(väliselvitysSubmitted)

      const valiselvitysdate = moment().add(14, 'days').format('DD.MM.YYYY')
      await setValiselvitysDate(page, avustushakuID, valiselvitysdate)

      const emailsBefore = await getValiselvitysPalauttamattaEmails(hakemusID)
      await sendValiselvitysPalauttamattaNotifications(page)
      const emailsAfter = await getValiselvitysPalauttamattaEmails(hakemusID)
      expect(emailsAfter).toEqual(emailsBefore)
    }
  )

  selvitysTest.extend<{ answers: Answers }>({
    answers: swedishAnswers,
  })(
    'reminder mail is sent in swedish for swedish hakemus',
    async ({
      page,
      hakuProps,
      avustushakuID,
      acceptedHakemus: { hakemusID, userKey },
      väliselvityspyyntöSent,
    }) => {
      expectToBeDefined(väliselvityspyyntöSent)
      const valiselvitysdate = moment().add(14, 'days').format('DD.MM.YYYY')
      await setValiselvitysDate(page, avustushakuID, valiselvitysdate)

      await sendValiselvitysPalauttamattaNotifications(page)
      const email = lastOrFail(await getValiselvitysPalauttamattaEmails(hakemusID))
      expect(email['to-address']).toHaveLength(1)
      expect(email['to-address']).toContain('lars.andersson@example.com')
      expect(email.subject).toContain('Påminnelse om att lämna in mellanredovisningen')
      expect(email['formatted']).toContain(`Bästa mottagare,

er mellanredovisning för användningen av statsunderstödet ${
        hakuProps.avustushakuName + ' på svenska'
      } har ännu inte lämnats in.

Kom ihåg att skicka mellanredovisningen för behandling inom utsatt tid, senast ${valiselvitysdate}. Länk till er mellanredovisningsblankett: ${HAKIJA_URL}/avustushaku/${avustushakuID}/valiselvitys?hakemus=${userKey}&lang=sv

Mera information får ni vid behov av kontaktpersonen som anges i beslutet. Vid tekniska problem, ta kontakt på adressen valtionavustukset@oph.fi
`)
    }
  )

  selvitysTest(
    'do not send reminders if valiselvitys pyyntö has not been sent',
    async ({ page, avustushakuID, acceptedHakemus: { hakemusID } }) => {
      const valiselvitysdate = moment().add(7, 'days').format('DD.MM.YYYY')
      await setValiselvitysDate(page, avustushakuID, valiselvitysdate)

      const emailsBefore = await getValiselvitysPalauttamattaEmails(hakemusID)
      await sendValiselvitysPalauttamattaNotifications(page)
      const emailsAfter = await getValiselvitysPalauttamattaEmails(hakemusID)
      expect(emailsAfter).toEqual(emailsBefore)
    }
  )
})

const sendValiselvitysPalauttamattaNotifications = (page: Page) =>
  page.request.post(`${VIRKAILIJA_URL}/api/test/send-valiselvitys-palauttamatta-notifications`, {
    failOnStatusCode: true,
  })

async function setValiselvitysDate(page: Page, avustushakuID: number, value: string) {
  const paatosPage = PaatosPage(page)
  await paatosPage.navigateTo(avustushakuID)
  await paatosPage.setValiselvitysDate(value)
  await paatosPage.waitForSave()
}
