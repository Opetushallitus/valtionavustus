import { expect, Page, test } from '@playwright/test'
import moment from 'moment'

import { getHakuaikaPaattymassaEmails, getLastEmail } from '../../utils/emails'
import { HAKIJA_URL, VIRKAILIJA_URL } from '../../utils/constants'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { randomString } from '../../utils/random'
import { muutoshakemusTest } from '../../fixtures/muutoshakemusTest'

const sendHakuaikaPaattymassaNotifications = (page: Page) =>
  page.request.post(`${VIRKAILIJA_URL}/api/test/send-hakuaika-paattymassa-notifications`)

type HakuaikaPaattymassaFixtures = {
  filledHakemus: {
    email: string
    userKey: string
    page: ReturnType<typeof HakijaAvustusHakuPage>
  }
  swedishHakemus: {
    email: string
    userKey: string
  }
}

const hakuaikaPaattymassaTest = muutoshakemusTest.extend<HakuaikaPaattymassaFixtures>({
  filledHakemus: async ({ avustushakuID, browser, answers }, use, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 30_000)

    const page = await browser.newPage()
    const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
    await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang)
    const randomEmail = `${randomString()}@example.com`
    const { contactPersonEmail, ...answersWithoutEmail } = answers
    const answersWithRandomEmail = {
      contactPersonEmail: randomEmail,
      ...answersWithoutEmail,
    }
    await hakijaAvustusHakuPage.fillMuutoshakemusEnabledHakemus(
      avustushakuID,
      answersWithRandomEmail
    )
    const userKey = await hakijaAvustusHakuPage.getUserKey()

    await use({ email: randomEmail, userKey, page: hakijaAvustusHakuPage })

    await page.close()
  },
  swedishHakemus: async ({ avustushakuID, page, swedishAnswers }, use, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 30_000)
    const answers = swedishAnswers

    const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
    await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang)
    const randomEmail = `${randomString()}@example.com`
    const { contactPersonEmail, ...answersWithoutEmail } = answers
    const answersWithRandomEmail = {
      contactPersonEmail: randomEmail,
      ...answersWithoutEmail,
    }
    await hakijaAvustusHakuPage.fillMuutoshakemusEnabledHakemus(
      avustushakuID,
      answersWithRandomEmail
    )
    const userKey = await hakijaAvustusHakuPage.getUserKey()
    await use({ email: randomEmail, userKey })
  },
})

const timezones = ['Europe/Helsinki', 'Europe/Stockholm']
for (const tz of timezones) {
  test.describe(`With time zone ${tz}`, async () => {
    test.use({ timezoneId: tz })

    test.describe('When avustushaku is closing tomorrow', () => {
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(12, 0, 0, 0)

      hakuaikaPaattymassaTest.use({
        hakuProps: ({ hakuProps }, use) => {
          use({
            ...hakuProps,
            hakuaikaEnd: tomorrow,
          })
        },
      })

      hakuaikaPaattymassaTest(
        'sends an email to those whose hakemus is expiring tomorrow',
        async ({ page, avustushakuID, filledHakemus, hakuProps }) => {
          await sendHakuaikaPaattymassaNotifications(page)
          await page.waitForTimeout(5000)

          const email = await getLastEmail('hakuaika-paattymassa', avustushakuID)

          expect(email['to-address']).toHaveLength(1)
          expect(email['to-address']).toContain(filledHakemus.email)
          expect(email.subject).toEqual('Hakuaika on päättymässä')

          const endDate = moment(hakuProps.hakuaikaEnd).format('DD.MM.YYYY')
          expect(email.formatted).toEqual(`Hyvä vastaanottaja,

teillä on keskeneräinen hakemus valtionavustuksessa ${hakuProps.avustushakuName}. Huomaa, että avustuksen hakuaika päättyy ${endDate} klo 12.00.

Hakemus muokkauksineen tallentuu automaattisesti Opetushallituksen valtionavustusjärjestelmään, mutta tullakseen vireille on
hakemus lähetettävä käsiteltäväksi ennen hakuajan päättymistä. Määräajan ulkopuolella saapunut hakemus voidaan ottaa käsiteltäväksi vain erityisen painavista syistä.

Pääsette viimeistelemään hakemuksenne tästä: ${HAKIJA_URL}/avustushaku/${avustushakuID}/nayta?hakemus=${filledHakemus.userKey}&lang=fi

Mikäli olette päättäneet jättää hakemuksen lähettämättä, on tämä viesti aiheeton.`)
        }
      )

      hakuaikaPaattymassaTest(
        'sends an email in swedish when hakemus is swedish',
        async ({ page, avustushakuID, swedishHakemus, hakuProps }) => {
          const filledHakemus = swedishHakemus
          await sendHakuaikaPaattymassaNotifications(page)
          await page.waitForTimeout(5000)

          const email = await getLastEmail('hakuaika-paattymassa', avustushakuID)

          expect(email['to-address']).toHaveLength(1)
          expect(email['to-address']).toContain(filledHakemus.email)
          expect(email.subject).toEqual('Ansökningstiden närmar sig sitt slut')

          const endDate = moment(hakuProps.hakuaikaEnd).format('DD.MM.YYYY')
          expect(email.formatted).toEqual(`Bästa mottagare,

ni har en halvfärdig ansökan om statsunderstöd ${
            hakuProps.avustushakuName + ' på svenska'
          }. Observera att ansökningstiden för understödet avslutas ${endDate} kl. 12.00.

Ansökan och ändringar som görs i ansökan sparas automatiskt i Utbildningsstyrelsens statsunderstödssystem, men för att ansökan ska behandlas behöver den skickas för behandling innan ansökningstiden avslutas. En ansökan som skickats efter att ansökningstiden avslutats kan tas till behandling endast av särskilt vägande skäl.

Ni kommer åt att färdigställa er ansökan via denna länk: ${HAKIJA_URL}/statsunderstod/${avustushakuID}/visa?hakemus=${
            filledHakemus.userKey
          }&lang=sv

Om ni har beslutat att inte lämna in ansökan föranleder detta meddelande inga åtgärder.`)
        }
      )

      hakuaikaPaattymassaTest(
        'does not send an e-mail to those whose hakemus has been sent',
        async ({ page, avustushakuID, filledHakemus }) => {
          await filledHakemus.page.submitApplication()

          await sendHakuaikaPaattymassaNotifications(page)
          await page.waitForTimeout(5000)

          await expectEmailNotSent(filledHakemus.email, avustushakuID)
        }
      )
    })

    test.describe('When avustushaku is closing later than tomorrow', () => {
      const today = new Date()
      const dayAfterTomorrow = new Date(today)
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)
      dayAfterTomorrow.setHours(12, 0, 0, 0)

      hakuaikaPaattymassaTest.use({
        hakuProps: ({ hakuProps }, use) => {
          use({
            ...hakuProps,
            hakuaikaEnd: dayAfterTomorrow,
          })
        },
      })

      hakuaikaPaattymassaTest(
        'does not send an e-mail',
        async ({ page, filledHakemus, avustushakuID }) => {
          await sendHakuaikaPaattymassaNotifications(page)
          await page.waitForTimeout(5000)

          await expectEmailNotSent(filledHakemus.email, avustushakuID)
        }
      )
    })
  })
}

async function expectEmailNotSent(email: string, avustushakuID: number) {
  const emails = await getHakuaikaPaattymassaEmails(avustushakuID)
  const expectedEmail = expect.objectContaining({
    'to-address': [email],
  })
  expect(emails).not.toContainEqual(expectedEmail)
}
