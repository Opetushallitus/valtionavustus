import axios from "axios"
import { expect, test } from "@playwright/test"

import { getAllEmails } from "../../utils/emails"
import { VIRKAILIJA_URL } from "../../utils/constants"
import { hakemusTest } from "../../fixtures/hakemusTest"
import { HakujenHallintaPage } from "../../pages/hakujenHallintaPage"
import { HakijaAvustusHakuPage } from "../../pages/hakijaAvustusHakuPage"
import { randomString } from "../../utils/random"

const sendHakuaikaPaattymassaNotifications = () =>
  axios.post(`${VIRKAILIJA_URL}/api/test/send-hakuaika-paattymassa-notifications`)

type HakuaikaPaattymassaFixtures = {
  hakuEndTime: Date
  hakemusDetails: {
    email: string
  }
}

const hakuaikaPaattymassaTest = hakemusTest.extend<HakuaikaPaattymassaFixtures>({
  hakuEndTime: new Date(),
  avustushakuID: async ({codes, page, haku, hakuEndTime}, use, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 50_000)

    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const avustushakuID = await hakujenHallintaPage.createMuutoshakemusEnabledHaku(haku.registerNumber, haku.avustushakuName, codes)
    const endTimeString = `${hakuEndTime.getDate()}.${hakuEndTime.getMonth()+1}.${hakuEndTime.getFullYear()} ${hakuEndTime.getHours()}.${hakuEndTime.getMinutes()}`
    await hakujenHallintaPage.setEndDate(endTimeString)
    await use(avustushakuID)
  },
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

  hakuaikaPaattymassaTest.use({ hakuEndTime: tomorrow })

  hakuaikaPaattymassaTest("sends an email to those whose hakemus is expiring tomorrow", async ({page, hakemusDetails, hakuEndTime}) => {
    await sendHakuaikaPaattymassaNotifications()
    await page.waitForTimeout(5000)

    const emails = await getAllEmails('hakuaika-paattymassa')
    const endDate = `${hakuEndTime.getDate()}.${hakuEndTime.getMonth() + 1}.${hakuEndTime.getFullYear()}`
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

  hakuaikaPaattymassaTest.use({ hakuEndTime: dayAfterTomorrow })

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