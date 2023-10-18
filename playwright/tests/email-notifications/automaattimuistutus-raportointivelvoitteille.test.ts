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

export const happyCaseMuistutusTest = muutoshakemusTest.extend({
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

export const cutoffMuistutusTest = muutoshakemusTest.extend({
  hakuProps: ({ hakuProps }, use) =>
    use({
      ...hakuProps,
      raportointivelvoitteet: [
        {
          raportointilaji: 'Muu raportti',
          maaraaika: moment().subtract(1, 'days').format('DD.MM.YYYY'),
          ashaTunnus: 'ASHA-1',
          lisatiedot: 'Eilen ei näy',
        },
        {
          raportointilaji: 'Väliraportti',
          maaraaika: deadline,
          ashaTunnus: 'ASHA-2',
          lisatiedot: 'Näkyy',
        },
        {
          raportointilaji: 'Loppuraportti',
          maaraaika: moment().add(31, 'days').format('DD.MM.YYYY'),
          ashaTunnus: 'ASHA-3',
          lisatiedot: '31 päivää tulevaisuudessa ei näy',
        },
      ],
    }),
})

cutoffMuistutusTest(
  'Muistutus ei lähde kuin 30pv sisällä oleville',
  async ({ page, userCache, closedAvustushaku, avustushakuID, avustushakuName }) => {
    expectToBeDefined(userCache)
    expectToBeDefined(closedAvustushaku)

    await new HakujenHallintaPage(page).navigate(avustushakuID)
    const haunTiedotUrl = page.url()

    await sendLahetaRaporttienMuistutusviestit(page)

    await test.step('eli väliraportille', async () => {
      const emails = await waitUntilMinEmails(
        (avustushakuId) => getMuistutusVäliraporttiEmails(avustushakuId),
        1,
        avustushakuID
      )
      expect(emails).toHaveLength(1)
      expectCorrectMuistutusViesti(emails[0], avustushakuName, haunTiedotUrl)
    })
    await test.step('muttei muille', async () => {
      expect(await getMuistutusAvustuspäätöksetEmails(avustushakuID)).toHaveLength(0)
      expect(await getMuistutusLoppuraporttiEmails(avustushakuID)).toHaveLength(0)
      expect(await getMuistutusMuuraporttiEmails(avustushakuID)).toHaveLength(0)
    })
  }
)

happyCaseMuistutusTest(
  'Muistutusviesti valtionavustuksen raportoinnista lähtee',
  async ({ page, userCache, closedAvustushaku, avustushakuID, avustushakuName }) => {
    expectToBeDefined(userCache)
    expectToBeDefined(closedAvustushaku)

    await new HakujenHallintaPage(page).navigate(avustushakuID)
    const haunTiedotUrl = page.url()

    await sendLahetaRaporttienMuistutusviestit(page)

    await test.step('avustuspäätöksille', async () => {
      const email = await waitForOnlyEmail(getMuistutusAvustuspäätöksetEmails)
      expectCorrectMuistutusViesti(email, avustushakuName, haunTiedotUrl)
    })

    await test.step('väliraporteille', async () => {
      const email = await waitForOnlyEmail(getMuistutusVäliraporttiEmails)
      expectCorrectMuistutusViesti(email, avustushakuName, haunTiedotUrl)
    })

    await test.step('loppuraporteille', async () => {
      const email = await waitForOnlyEmail(getMuistutusLoppuraporttiEmails)
      expectCorrectMuistutusViesti(email, avustushakuName, haunTiedotUrl)
    })

    await test.step('muille raporteille', async () => {
      const email = await waitForOnlyEmail(getMuistutusMuuraporttiEmails)
      expectCorrectMuistutusViesti(email, avustushakuName, haunTiedotUrl)
    })

    async function waitForOnlyEmail(emailFunc: (avustushakuID: number) => Promise<Email[]>) {
      const emails = await waitUntilMinEmails(emailFunc, 1, avustushakuID)
      expect(emails).toHaveLength(1)
      return emails[0]
    }
  }
)

function expectCorrectMuistutusViesti(
  email: Email,
  avustushakuName: string,
  haunTiedotUrl: string
) {
  expect(email.formatted).toBe(emailBody(avustushakuName, haunTiedotUrl))
  expect(email['to-address']).toEqual([
    'santeri.horttanainen@reaktor.com',
    'viivi.virkailja@exmaple.com',
  ])
  expect(email.subject).toBe('Muistutus valtionavustuksen raportoinnista')
  expect(email['reply-to']).toBeUndefined()
}

async function sendLahetaRaporttienMuistutusviestit(page: Page) {
  await page.request.post(`${VIRKAILIJA_URL}/api/test/trigger-raportointivelvoite-muistustus`, {
    failOnStatusCode: true,
  })
}

const emailBody = (avustusName: string, haunTiedotLink: string) => `Hyvä vastaanottaja,

valtionavustukselle ${avustusName} kirjatun raportointivelvoitteen määräaika on ${deadline}.

Linkki hakuun: ${haunTiedotLink}

Laatikaa vaadittu raportti vastuuvalmistelijan johdolla ja tallentakaa se Opetushallituksen asianhallintajärjestelmään. Lähettäkää raportti raportointivelvoitteen asettajalle annettuun määräaikaan mennessä. Lähettäminen tulee tehdä asianhallintajärjestelmästä, mikäli määrärahan asettaja ei ole toisin ohjeistanut.

Raportoinnissa tulee noudattaa määrärahan asettajan ohjauskirjeessä asettamia rajauksia.

Yleiset ohjeet raportin laadintaan, tallentamiseen ja lähettämiseen löydät täältä: https://intra.oph.fi/display/VALA/Raportointi+ja+vaikutusten+arviointi

Ongelmatilanteissa saat apua osoitteesta: valtionavustukset@oph.fi
`
