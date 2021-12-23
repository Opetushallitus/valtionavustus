import {expect} from "@playwright/test"
import {
  getAllEmails
} from "../../utils/emails"

import {sendHakuaikaPaattymassaNotifications} from "../../utils/hakuaika-paattymassa";
import {hakuaikaPaattymassaTest as test} from "../../fixtures/hakuaikaPaattymassaTest";
import {
  navigate
} from "../../utils/navigate"

test("sends an email to those whose hakemus is expiring tomorrow", async ({page, hakemusDetails}) => {
  await navigate(page, "/")
  const oldEmails = await getAllEmails('hakuaika-paattymassa')
  await sendHakuaikaPaattymassaNotifications()
  await page.waitForTimeout(5000)

  const emails = await getAllEmails('hakuaika-paattymassa')
  expect(emails).toEqual(expect.arrayContaining([...oldEmails, expect.objectContaining({ 'to-address': [hakemusDetails.email] })]))
})
