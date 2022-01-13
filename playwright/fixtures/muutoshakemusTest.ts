import { test } from '@playwright/test'
import {HakemustenArviointiPage} from "../pages/hakemustenArviointiPage";
import {HakujenHallintaPage} from "../pages/hakujenHallintaPage";
import {HakijaAvustusHakuPage} from "../pages/hakijaAvustusHakuPage";
import { defaultValues } from "./defaultValues";
import { VIRKAILIJA_URL } from '../utils/constants'

export interface MuutoshakemusFixtures {
  avustushakuID: number
  submittedHakemus: {
    userKey: string
  }
  acceptedHakemus: {
    hakemusID: number
    userKey: string
  }
}

/**
 * Creates a muutoshakuenabled hakemus with käyttöaika and sisältö, but no budjetti
 */
export const muutoshakemusTest = defaultValues.extend<MuutoshakemusFixtures>({
  avustushakuID: async ({page, hakuProps}, use, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 40_000)
    await test.step("populate user cache", async() => {
      const users = [
        {
          "person-oid": "1.2.246.562.24.15653262222",
          "first-name": "_",
          surname: "valtionavustus",
          email: "santeri.horttanainen@reaktor.com",
          lang: "fi",
          privileges: ["va-admin"]
        },
        {
          "person-oid": "1.2.246.562.24.99000000001",
          "first-name": "Päivi",
          surname: "Pääkäyttäjä",
          email: "paivi.paakayttaja@example.com",
          lang: "fi",
          privileges: ["va-admin"]
        },
        {
          "person-oid": "1.2.246.562.24.99000000002",
          "first-name": "Viivi",
          surname: "Virkailija",
          email: "viivi.virkailja@exmaple.com",
          lang: "fi",
          privileges: ["va-user"]
        }
      ]
      await page.request.post(`${VIRKAILIJA_URL}/api/test/user-cache`, { data: users })
    })

    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const avustushakuID = await hakujenHallintaPage.createMuutoshakemusEnabledHaku(hakuProps)
    await use(avustushakuID)
  },
  submittedHakemus: async ({avustushakuID, answers, page}, use, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 15_000)

    const hakijaAvustusHakuPage = new HakijaAvustusHakuPage(page)
    await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang)
    const {userKey} = await hakijaAvustusHakuPage.fillAndSendMuutoshakemusEnabledHakemus(avustushakuID, answers)
    use({userKey})
  },
  acceptedHakemus: async ({avustushakuID, page, submittedHakemus: {userKey}}, use, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 25_000)

    const hakujenHallintaPage = new HakujenHallintaPage(page)
    await hakujenHallintaPage.navigate(avustushakuID)
    await hakujenHallintaPage.closeAvustushakuByChangingEndDateToPast()

    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    await hakemustenArviointiPage.navigate(avustushakuID)
    const hakemusID = await hakemustenArviointiPage.acceptAvustushaku(avustushakuID, "100000", "Ammatillinen koulutus")

    await hakujenHallintaPage.navigate(avustushakuID)
    await hakujenHallintaPage.resolveAvustushaku()

    await hakemustenArviointiPage.navigate(avustushakuID)
    await hakemustenArviointiPage.selectValmistelijaForHakemus(avustushakuID, hakemusID, "_ valtionavustus")

    await hakujenHallintaPage.navigateToPaatos(avustushakuID)
    await hakujenHallintaPage.sendPaatos(avustushakuID)

    await use({hakemusID, userKey})
  }
})
