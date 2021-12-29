import {HakemustenArviointiPage} from "../pages/hakemustenArviointiPage";
import {HakujenHallintaPage} from "../pages/hakujenHallintaPage";
import {HakijaAvustusHakuPage} from "../pages/hakijaAvustusHakuPage";
import { defaultValues } from "./defaultValues";

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
