import {MuutoshakemusFixtures} from "./muutoshakemusTest";
import {HakujenHallintaPage} from "../pages/hakujenHallintaPage";
import {HakijaAvustusHakuPage} from "../pages/hakijaAvustusHakuPage";
import {HakemustenArviointiPage} from "../pages/hakemustenArviointiPage";
import {Budget, defaultBudget} from "../utils/budget";
import {answers} from "../utils/constants";
import { defaultValues } from "./defaultValues";

export interface BudjettimuutoshakemusFixtures extends MuutoshakemusFixtures {
  budget: Budget
  userKey: string
}

export const budjettimuutoshakemusTest = defaultValues.extend<BudjettimuutoshakemusFixtures>({
  answers,
  budget: defaultBudget,
  avustushakuID: async ({page, hakuProps}, use) => {
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const avustushakuID = await hakujenHallintaPage.createBudjettimuutosEnabledHaku(hakuProps)
    await use(avustushakuID)
  },
  hakemus: async ({avustushakuID, page, budget, answers}, use) => {
    const hakijaAvustusHakuPage = new HakijaAvustusHakuPage(page)
    await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang)
    const {userKey} = await hakijaAvustusHakuPage.fillAndSendBudjettimuutoshakemusEnabledHakemus(avustushakuID, answers, budget)
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    await hakujenHallintaPage.navigate(avustushakuID)
    await hakujenHallintaPage.closeAvustushakuByChangingEndDateToPast()
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    await hakemustenArviointiPage.navigate(avustushakuID)
    const hakemusID = await hakemustenArviointiPage.acceptAvustushaku(avustushakuID, budget, "Ammatillinen koulutus")
    await hakujenHallintaPage.navigate(avustushakuID)
    await hakujenHallintaPage.resolveAvustushaku()
    await hakemustenArviointiPage.navigate(avustushakuID)
    await hakemustenArviointiPage.selectValmistelijaForHakemus(avustushakuID, hakemusID, "_ valtionavustus")
    await hakujenHallintaPage.navigateToPaatos(avustushakuID)
    await hakujenHallintaPage.sendPaatos(avustushakuID)
    await use({hakemusID, userKey})
  }
})
