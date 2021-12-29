import {HakujenHallintaPage} from "../pages/hakujenHallintaPage"
import { defaultValues } from "./defaultValues";

type HakemusFixtures = {
  avustushakuID: number
}

export const avustushakuTest = defaultValues.extend<HakemusFixtures>({
  avustushakuID: async ({page, hakuProps}, use, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 40_000)

    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const avustushakuID = await hakujenHallintaPage.createMuutoshakemusEnabledHaku(hakuProps)
    await use(avustushakuID)
  }
})
