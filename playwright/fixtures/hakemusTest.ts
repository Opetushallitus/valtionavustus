import {HakujenHallintaPage, HakuProps} from "../pages/hakujenHallintaPage"
import {HakijaAvustusHakuPage} from "../pages/hakijaAvustusHakuPage"
import {answers} from "../utils/constants"
import {Answers, VaCodeValues} from "../utils/types"
import { defaultValues } from "./defaultValues";

export interface HakemusFixtures {
  avustushakuID: number
  hakemus: {
    userKey: string
  }
  hakuProps: HakuProps
  answers: Answers
  codes: VaCodeValues
}

export const hakemusTest = defaultValues.extend<HakemusFixtures>({
  answers,
  avustushakuID: async ({page, hakuProps}, use, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 40_000)

    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const avustushakuID = await hakujenHallintaPage.createMuutoshakemusEnabledHaku(hakuProps)
    await use(avustushakuID)
  },
  hakemus: async ({avustushakuID, page, answers}, use, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 30_000)

    const hakijaAvustusHakuPage = new HakijaAvustusHakuPage(page)
    await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang)
    const {userKey} = await hakijaAvustusHakuPage.fillAndSendMuutoshakemusEnabledHakemus(avustushakuID, answers)
    await use({userKey})
  }
})
