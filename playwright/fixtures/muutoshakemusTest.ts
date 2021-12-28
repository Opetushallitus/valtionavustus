import {HakemustenArviointiPage} from "../pages/hakemustenArviointiPage";
import {HakujenHallintaPage} from "../pages/hakujenHallintaPage";
import {HakijaAvustusHakuPage} from "../pages/hakijaAvustusHakuPage";
import {answers} from "../utils/constants";
import {Answers} from "../utils/types";
import { defaultValues } from "./defaultValues";

export interface MuutoshakemusFixtures {
  avustushakuID: number
  hakemus: {
    hakemusID: number
    userKey: string
  }
  answers: Answers
}

/**
 * Creates a muutoshakuenabled hakemus with käyttöaika and sisältö, but no budjetti
 */
export const muutoshakemusTest = defaultValues.extend<MuutoshakemusFixtures>({
  answers,
  avustushakuID: async ({page, hakuProps}, use) => {
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const avustushakuID = await hakujenHallintaPage.createMuutoshakemusEnabledHaku(hakuProps)
    await use(avustushakuID)
  },
  hakemus: async ({avustushakuID, page, answers}, use) => {
    const hakijaAvustusHakuPage = new HakijaAvustusHakuPage(page)
    await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang)
    const {userKey} = await hakijaAvustusHakuPage.fillAndSendMuutoshakemusEnabledHakemus(avustushakuID, answers)
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
