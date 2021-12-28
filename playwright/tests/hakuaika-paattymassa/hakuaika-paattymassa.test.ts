import axios from "axios"
import { expect } from "@playwright/test"

import { getAllEmails } from "../../utils/emails"
import { navigate } from "../../utils/navigate"
import { VIRKAILIJA_URL } from "../../utils/constants"
import { hakuaikaPaattymassaTest as test } from "../../fixtures/hakuaikaPaattymassaTest"

const sendHakuaikaPaattymassaNotifications = () =>
  axios.post(`${VIRKAILIJA_URL}/api/test/send-hakuaika-paattymassa-notifications`)

test("sends an email to those whose hakemus is expiring tomorrow", async ({page, hakemusDetails}) => {
  await navigate(page, "/")
  const oldEmails = await getAllEmails('hakuaika-paattymassa')
  await sendHakuaikaPaattymassaNotifications()
  await page.waitForTimeout(5000)

  const emails = await getAllEmails('hakuaika-paattymassa')
  expect(emails).toEqual(expect.arrayContaining([...oldEmails, expect.objectContaining({ 'to-address': [hakemusDetails.email] })]))
})
