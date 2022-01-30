import {muutoshakemusTest} from "../fixtures/muutoshakemusTest";
import {
  getAcceptedPäätösEmails,
  getLoppuselvitysEmails,
  getValiselvitysEmails,
  getLinkToMuutoshakemusFromSentEmails,
  lastOrFail,
  waitUntilMinEmails, getPaatoksetLahetettyEmails
} from "../utils/emails";
import {expect, Page} from "@playwright/test"
import {HakujenHallintaPage} from "../pages/hakujenHallintaPage";
import {HakijaMuutoshakemusPage} from "../pages/hakijaMuutoshakemusPage";
import {VIRKAILIJA_URL} from "../utils/constants";
import {expectToBeDefined} from "../utils/util";

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

const getSearchUrl = async ({page, avustushakuID, hakemusIds}: {page: Page, avustushakuID: number, hakemusIds: number[]}) => {
  const res = await page.request.put(`${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/searches`, {
    data: { "hakemus-ids": hakemusIds }
  })
  const json = await res.json()
  const searchUrl = json["search-url"]
  expectToBeDefined(searchUrl)
  return searchUrl
}

test('sends emails to correct contact and hakemus emails', async ({page, acceptedHakemus: {hakemusID}, avustushakuID, hakuProps}) => {
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
  await test.step('virkailija gets päätökset lähetetty email', async () => {
    const emails = await waitUntilMinEmails(getPaatoksetLahetettyEmails, 1, avustushakuID)
    const searchUrl = await getSearchUrl({page, hakemusIds: [hakemusID], avustushakuID})
    expect(emails).toHaveLength(1)
    const email = lastOrFail(emails)
    expect(email["to-address"]).toEqual([
      "santeri.horttanainen@reaktor.com",
      "viivi.virkailja@exmaple.com"
    ])
    expect(email.subject).toEqual("Avustuspäätökset on lähetetty")
    expect(email.formatted).toEqual(`Hei!

Valtionavustuksen ${hakuProps.avustushakuName} päätökset on lähetetty kaikkien hakijoiden yhteyshenkilöille sekä hakijoiden virallisiin sähköpostiosoitteisiin.

Linkki avustuksen päätöslistaan: ${VIRKAILIJA_URL}${searchUrl}

Avustuksen päätökset tulee julkaista oph.fi-verkkopalvelussa ohjeistuksen mukaisesti https://intra.oph.fi/pages/viewpage.action?pageId=99516838

Avustusten maksatukset toteutetaan päätöksessä kuvatun aikataulun mukaan. Ohjeet maksatusten tekemiseksi löytyvät: https://intra.oph.fi/display/VALA/Avustusten+maksaminen

Ongelmatilanteissa saat apua osoitteesta: valtionavustukset@oph.fi
`)
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
