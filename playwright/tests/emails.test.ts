import {muutoshakemusTest} from "../fixtures/muutoshakemusTest";
import {
  getAcceptedPäätösEmails,
  getLoppuselvitysEmails,
  getValiselvitysEmails,
  getLinkToMuutoshakemusFromSentEmails,
  lastOrFail,
  waitUntilMinEmails,
} from "../utils/emails";
import {expect} from "@playwright/test"
import {HakujenHallintaPage} from "../pages/hakujenHallintaPage";
import {HakijaMuutoshakemusPage} from "../pages/hakijaMuutoshakemusPage";

const contactPersonEmail = "yrjo.yhteyshenkilo@example.com"
const newContactPersonEmail = "uusi.yhteyshenkilo@example.com"

const test = muutoshakemusTest.extend({
  answers: async ({}, use) => {
    await use({
      contactPersonEmail,
      contactPersonName: "Yrjö Yhteyshenkilö",
      contactPersonPhoneNumber: "0501234567",
      projectName: "Hanke päätöksen uudelleenlähetyksen testaamiseksi",
    })
  }
})

test('sends emails to correct contact and hakemus emails', async ({page, acceptedHakemus: {hakemusID}, avustushakuID}) => {
  const linkToMuutoshakemus = await getLinkToMuutoshakemusFromSentEmails(hakemusID)
  await test.step('sends päätös email', async () => {
    const emails = await waitUntilMinEmails(getAcceptedPäätösEmails, 1, hakemusID)
    expect(emails).toHaveLength(1)
    const email = lastOrFail(emails)
    expect(email["to-address"]).toEqual([
      contactPersonEmail,
      "akaan.kaupunki@akaa.fi"
    ])
  })
  const hakujenHallintaPage = new HakujenHallintaPage(page)
  await hakujenHallintaPage.navigateToPaatos(avustushakuID)
  await test.step('resends päätös', async () => {
    await hakujenHallintaPage.resendPaatokset(1)
    const emails = await waitUntilMinEmails(getAcceptedPäätösEmails, 2, hakemusID)
    expect(emails).toHaveLength(2)
    const email = lastOrFail(emails)
    expect(email["to-address"]).toEqual([
      contactPersonEmail,
      "akaan.kaupunki@akaa.fi"
    ])
  })
  const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page)
  await test.step('resends to correct address after changing contact person email', async () => {
    await hakijaMuutoshakemusPage.navigateWithLink(linkToMuutoshakemus)
    await hakijaMuutoshakemusPage.changeContactPersonEmailTo(newContactPersonEmail)
    await hakijaMuutoshakemusPage.clickSaveContacts()
    await hakujenHallintaPage.navigateToPaatos(avustushakuID)
    await hakujenHallintaPage.resendPaatokset()

    const emails = await waitUntilMinEmails(getAcceptedPäätösEmails, 3, hakemusID)
    expect(emails).toHaveLength(3)
    const email = lastOrFail(emails)
    expect(email["to-address"]).toEqual([
      newContactPersonEmail,
      "akaan.kaupunki@akaa.fi"
    ])
  })
  await test.step('sends väliselvitys email', async () => {
    await hakujenHallintaPage.switchToValiselvitysTab()
    await hakujenHallintaPage.sendValiselvitys()
    const emails = await waitUntilMinEmails(getValiselvitysEmails, 1, hakemusID)
    expect(emails).toHaveLength(1)
    const email = lastOrFail(emails)
    expect(email["to-address"]).toEqual([
      newContactPersonEmail,
      "akaan.kaupunki@akaa.fi"
    ])
    expect(email.bcc).toBeNull()
  })
  await test.step('sends loppuselvitys email', async () => {
    await hakujenHallintaPage.switchToLoppuselvitysTab()
    await hakujenHallintaPage.sendLoppuselvitys()
    const emails = await waitUntilMinEmails(getLoppuselvitysEmails, 1, hakemusID)
    expect(emails).toHaveLength(1)
    const email = lastOrFail(emails)
    expect(email["to-address"]).toEqual([
      newContactPersonEmail,
      "akaan.kaupunki@akaa.fi"
    ])
    expect(email.bcc).toBeNull()
  })
})
