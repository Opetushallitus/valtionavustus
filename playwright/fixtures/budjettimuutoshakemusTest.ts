import { expect } from '@playwright/test'
import {HakujenHallintaPage} from "../pages/hakujenHallintaPage";
import {HakijaAvustusHakuPage} from "../pages/hakijaAvustusHakuPage";
import {HakemustenArviointiPage} from "../pages/hakemustenArviointiPage";
import {Budget, defaultBudget} from "../utils/budget";
import { defaultValues } from "./defaultValues";
import { MuutoshakemusFixtures } from "./muutoshakemusTest";

export interface BudjettimuutoshakemusFixtures extends MuutoshakemusFixtures {
  budget: Budget
  avustushakuID: number
}

export const budjettimuutoshakemusTest = defaultValues.extend<BudjettimuutoshakemusFixtures>({
  budget: defaultBudget,
  avustushakuID: async ({page, hakuProps, userCache}, use, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 40_000)
    expect(userCache).toBeDefined()

    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const avustushakuID = await hakujenHallintaPage.createBudjettimuutosEnabledHaku(hakuProps)
    await use(avustushakuID)
  },
  submittedHakemus: async ({page, avustushakuID, answers, budget}, use, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 15_000)

    const hakijaAvustusHakuPage = new HakijaAvustusHakuPage(page)
    await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang)
    await hakijaAvustusHakuPage.fillBudjettimuutoshakemusEnabledHakemus(avustushakuID, answers, budget)
    const {userKey} = await hakijaAvustusHakuPage.submitApplication()
    use({userKey})
  },
  acceptedHakemus: async ({avustushakuID, ukotettuValmistelija, page, budget, answers, submittedHakemus: {userKey}}, use, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 25_000)

    const hakujenHallintaPage = new HakujenHallintaPage(page)
    await hakujenHallintaPage.navigate(avustushakuID)
    await hakujenHallintaPage.closeAvustushakuByChangingEndDateToPast()

    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    await hakemustenArviointiPage.navigate(avustushakuID)
    const hakemusID = await hakemustenArviointiPage.acceptAvustushaku(avustushakuID, answers.projectName, budget)

    await hakujenHallintaPage.navigate(avustushakuID)
    await hakujenHallintaPage.resolveAvustushaku()

    await hakemustenArviointiPage.navigate(avustushakuID)
    await hakemustenArviointiPage.selectValmistelijaForHakemus(avustushakuID, hakemusID, ukotettuValmistelija)

    await hakujenHallintaPage.navigateToPaatos(avustushakuID)
    await hakujenHallintaPage.sendPaatos(avustushakuID)

    await use({hakemusID, userKey})
  }
})
