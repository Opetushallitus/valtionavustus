import {test} from "@playwright/test"

import {createRandomHakuValues} from "../utils/random"
import {KoodienhallintaPage} from "../pages/koodienHallintaPage"
import {HakujenHallintaPage} from "../pages/hakujenHallintaPage"
import {HakijaAvustusHakuPage} from "../pages/hakijaAvustusHakuPage"
import {answers} from "../utils/constants"
import {Answers, VaCodeValues} from "../utils/types"

export interface HakemusFixtures {
  avustushakuID: number
  hakemus: {
    userKey: string
  }
  codes: VaCodeValues
  haku: {
    registerNumber: string
    avustushakuName: string
  }
  answers: Answers
}

export const hakemusTest = test.extend<HakemusFixtures>({
  answers,
  haku: async ({}, use) => {
    const randomHakuValues = createRandomHakuValues()
    await use(randomHakuValues)
  },
  codes: async ({page}, use, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 20_000)

    const koodienHallintaPage = new KoodienhallintaPage(page)
    const codes = await koodienHallintaPage.createRandomCodeValues()
    await use(codes)
  },
  avustushakuID: async ({codes, page, haku}, use, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 40_000)

    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const avustushakuID = await hakujenHallintaPage.createMuutoshakemusEnabledHaku(haku.registerNumber, haku.avustushakuName, codes)
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
