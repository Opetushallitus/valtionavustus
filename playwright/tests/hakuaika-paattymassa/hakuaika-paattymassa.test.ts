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
  const oldEmailCount = (await getAllEmails('hakuaika-paattymassa'))
    .filter(e => e["to-address"].includes(hakemusDetails.email)).length
  await sendHakuaikaPaattymassaNotifications()

  const emails = (await getAllEmails('hakuaika-paattymassa'))
    .filter(e => e["to-address"].includes(hakemusDetails.email))
  expect(emails.length).toEqual(oldEmailCount + 1)
})
