import { expect, Page, test } from '@playwright/test'
import moment from 'moment/moment'
import { expectToBeDefined } from '../../utils/util'
import { muutoshakemusTest } from '../../fixtures/muutoshakemusTest'
import {
  Email,
  getMuistutusAvustuspäätöksetEmails,
  getMuistutusLoppuraporttiEmails,
  getMuistutusMuuraporttiEmails,
  getMuistutusVäliraporttiEmails,
  waitUntilMinEmails,
} from '../../utils/emails'
import { VIRKAILIJA_URL } from '../../utils/constants'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'

const deadline = moment().add(30, 'days').format('DD.MM.YYYY')

export const muistutusEmailTest = muutoshakemusTest.extend({
  hakuProps: ({ hakuProps }, use) =>
    use({
      ...hakuProps,
      raportointivelvoitteet: [
        {
          raportointilaji: 'Muu raportti',
          maaraaika: deadline,
          ashaTunnus: 'ASHA-1',
          lisatiedot: 'Am-muu',
        },
        {
          raportointilaji: 'Loppuraportti',
          maaraaika: deadline,
          ashaTunnus: 'ASHA-2',
          lisatiedot: 'loppu',
        },
        {
          raportointilaji: 'Väliraportti',
          maaraaika: deadline,
          ashaTunnus: 'ASHA-3',
          lisatiedot: 'väli',
        },
        {
          raportointilaji: 'Avustuspäätökset',
          maaraaika: deadline,
          ashaTunnus: 'ASHA-4',
          lisatiedot: 'Apustakaa',
        },
      ],
    }),
})

muistutusEmailTest(
  'Muistutusviesti valtionavustuksen raportoinnista lähtee',
  async ({ page, userCache, closedAvustushaku, avustushakuID, avustushakuName }) => {
    expectToBeDefined(userCache)
    expectToBeDefined(closedAvustushaku)

    await new HakujenHallintaPage(page).navigate(avustushakuID)
    const haunTiedotUrl = page.url()

    test.fail()
    await sendLahetaRaporttienMuistutusviestit(page)

    await test.step('avustuspäätöksille', async () => {
      const email = await waitForOnlyEmail(getMuistutusAvustuspäätöksetEmails)
      expectCorrectMuistutusViesti(email)
    })

    await test.step('väliraporteille', async () => {
      const email = await waitForOnlyEmail(getMuistutusVäliraporttiEmails)
      expectCorrectMuistutusViesti(email)
    })

    await test.step('loppuraporteille', async () => {
      const email = await waitForOnlyEmail(getMuistutusLoppuraporttiEmails)
      expectCorrectMuistutusViesti(email)
    })

    await test.step('muille raporteille', async () => {
      const email = await waitForOnlyEmail(getMuistutusMuuraporttiEmails)
      expectCorrectMuistutusViesti(email)
    })

    async function waitForOnlyEmail(emailFunc: (avustushakuID: number) => Promise<Email[]>) {
      const emails = await waitUntilMinEmails(emailFunc, 1, avustushakuID)
      if (emails.length !== 1) throw new Error('Found more than one email, cannot continue')

      return emails[0]
    }

    function expectCorrectMuistutusViesti(email: Email) {
      expect(email.formatted).toBe(emailBody(avustushakuName, haunTiedotUrl))
      expect(email['to-address']).toEqual([
        'santeri.horttanainen@reaktor.com',
        'viivi.virkailja@exmaple.com',
      ])
      expect(email.subject).toBe('Muistutus valtionavustuksen raportoinnista')
      expect(email['reply-to']).toBeNull()
    }
  }
)

async function sendLahetaRaporttienMuistutusviestit(page: Page) {
  await page.request.post(`${VIRKAILIJA_URL}/api/test/send-raporttien-muistutusviestit`, {
    failOnStatusCode: true,
  })
}

const emailBody = (avustusName: string, haunTiedotLink: string) => `Hyvä vastaanottaja,

valtionavustukselle ${avustusName} kirjatun raportointivelvoitteen määräaika on ${deadline}.

Linkki hakuun: ${haunTiedotLink}

Laatikaa vaadittu raportti vastuuvalmistelijan johdolla ja tallentakaa se Opetushallituksen asianhallintajärjestelmään. Lähettäkää raportti raportointivelvoitteen asettajalle annettuun määräaikaan mennessä. Lähettäminen tulee tehdä asianhallintajärjestelmästä, mikäli määrärahan asettaja ei ole toisin ohjeistanut.

Raportoinnissa tulee noudattaa määrärahan asettajan ohjauskirjeessä asettamia rajauksia.

Yleiset ohjeet raportin laadintaan, tallentamiseen ja lähettämiseen löydät täältä: https://intra.oph.fi/display/VALA/Raportointi+ja+vaikutusten+arviointi

Ongelmatilanteissa saat apua osoitteesta: valtionavustukset@oph.fi`
