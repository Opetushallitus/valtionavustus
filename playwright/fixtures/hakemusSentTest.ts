import { expect } from '@playwright/test'

import { HakujenHallintaPage } from '../pages/hakujenHallintaPage'
import { HakijaAvustusHakuPage } from '../pages/hakijaAvustusHakuPage'
import { Budget, defaultBudget } from '../utils/budget'
import { defaultValues } from './defaultValues'

export interface HakemusSentFixtures {
  budget: Budget
  avustushakuID: number
  hakemusUserKey: string
}

export const hakemusSentTest = defaultValues.extend<HakemusSentFixtures>({
  budget: defaultBudget,
  avustushakuID: async ({ page, hakuProps, userCache }, use, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 40_000)
    expect(userCache).toBeDefined()

    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const props = {
      ...hakuProps,
      selectionCriteria: [
        'Onko hyvin tehty?',
        'Onko mittää järkee?',
      ],
    }
    const avustushakuID = await hakujenHallintaPage.createBudjettimuutosEnabledHaku(props)
    await use(avustushakuID)
  },
  hakemusUserKey: async ({ page, avustushakuID, answers, budget }, use, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 15_000)

    const hakijaAvustusHakuPage = new HakijaAvustusHakuPage(page)
    await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang)
    await hakijaAvustusHakuPage.fillBudjettimuutoshakemusEnabledHakemus(avustushakuID, answers, budget)
    const {userKey} = await hakijaAvustusHakuPage.submitApplication()
    use(userKey)
  }
})
