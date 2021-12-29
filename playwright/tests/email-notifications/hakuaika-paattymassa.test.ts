import axios from "axios"
import { expect, test } from "@playwright/test"
import moment from "moment"

import { getAllEmails } from "../../utils/emails"
import { VIRKAILIJA_URL } from "../../utils/constants"
import { hakemusTest } from "../../fixtures/hakemusTest"
import { HakijaAvustusHakuPage } from "../../pages/hakijaAvustusHakuPage"
import { randomString } from "../../utils/random"

const sendHakuaikaPaattymassaNotifications = () =>
  axios.post(`${VIRKAILIJA_URL}/api/test/send-hakuaika-paattymassa-notifications`)

type HakuaikaPaattymassaFixtures = {
  hakemusDetails: {
    email: string
  }
}

const hakuaikaPaattymassaTest = hakemusTest.extend<HakuaikaPaattymassaFixtures>({
  hakemusDetails: async ({avustushakuID, page, answers}, use, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 30_000)

    const hakijaAvustusHakuPage = new HakijaAvustusHakuPage(page)
    await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang)
    const randomEmail = `${randomString()}@example.com`
    const {contactPersonEmail, ...answersWithoutEmail} = answers
    const answersWithRandomEmail = {contactPersonEmail: randomEmail, ...answersWithoutEmail}
    await hakijaAvustusHakuPage.fillMuutoshakemusEnabledHakemus(avustushakuID, answersWithRandomEmail)
    await use({email: randomEmail})
  }
})

test.describe('When avustushaku is closing tomorrow', () => {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  hakuaikaPaattymassaTest.use({
    hakuProps: ({hakuProps}, use) => {
      use({
        ...hakuProps,
        hakuaikaEnd: tomorrow,
      })
    }
  })

  hakuaikaPaattymassaTest("sends an email to those whose hakemus is expiring tomorrow", async ({page, hakemusDetails, hakuProps}) => {
    await sendHakuaikaPaattymassaNotifications()
    await page.waitForTimeout(5000)

    const emails = await getAllEmails('hakuaika-paattymassa')
    const endDate = moment(hakuProps.hakuaikaEnd).format('D.M.YYYY')
    const expectedEmail = expect.objectContaining({
      'to-address': [hakemusDetails.email],
      formatted: expect.stringContaining(`hakuaika päättyy ${endDate}`),
    })
    expect(emails).toContainEqual(expectedEmail)
  })
})

test.describe('When avustushaku is closing later than tomorrow', () => {
  const today = new Date()
  const dayAfterTomorrow = new Date(today)
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)

  hakuaikaPaattymassaTest.use({
    hakuProps: ({hakuProps}, use) => {
      use({
        ...hakuProps,
        hakuaikaEnd: dayAfterTomorrow,
      })
    }
  })

  hakuaikaPaattymassaTest("does not send an e-mail", async ({page, hakemusDetails}) => {
    await sendHakuaikaPaattymassaNotifications()
    await page.waitForTimeout(5000)

    const emails = await getAllEmails('hakuaika-paattymassa')
    const expectedEmail = expect.objectContaining({
      'to-address': [hakemusDetails.email],
    })
    expect(emails).not.toContainEqual(expectedEmail)
  })
})