import { expect } from '@playwright/test'
import { HakujenHallintaPage } from '../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { HakijaAvustusHakuPage } from '../pages/hakija/hakijaAvustusHakuPage'
import { HakemustenArviointiPage } from '../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { AcceptedBudget, Budget, defaultBudget } from '../utils/budget'
import { defaultValues } from './defaultValues'
import { MuutoshakemusFixtures } from './muutoshakemusTest'
import { PaatosPage } from '../pages/virkailija/hakujen-hallinta/PaatosPage'
import { TEST_Y_TUNNUS } from '../utils/constants'

export interface BudjettimuutoshakemusFixtures extends MuutoshakemusFixtures {
  budget: Budget
  acceptedBudget: AcceptedBudget | Budget | undefined
  avustushakuID: number
}

export const budjettimuutoshakemusTest = defaultValues.extend<BudjettimuutoshakemusFixtures>({
  budget: defaultBudget,
  acceptedBudget: undefined,
  avustushakuID: async ({ page, hakuProps, userCache }, use, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 40_000)
    expect(userCache).toBeDefined()

    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const avustushakuID = await hakujenHallintaPage.createBudjettimuutosEnabledHaku(hakuProps)
    await use(avustushakuID)
  },
  submittedHakemus: async ({ page, avustushakuID, answers, budget }, use, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 15_000)

    const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
    await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang)
    await hakijaAvustusHakuPage.fillBudjettimuutoshakemusEnabledHakemus(
      avustushakuID,
      TEST_Y_TUNNUS,
      answers,
      budget
    )
    const { userKey } = await hakijaAvustusHakuPage.submitApplication()
    await use({ userKey })
  },
  acceptedHakemus: async (
    {
      avustushakuID,
      ukotettuValmistelija,
      page,
      budget,
      acceptedBudget,
      answers,
      submittedHakemus: { userKey },
      projektikoodi,
    },
    use,
    testInfo
  ) => {
    testInfo.setTimeout(testInfo.timeout + 25_000)

    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const haunTiedotPage = await hakujenHallintaPage.navigate(avustushakuID)
    await haunTiedotPage.closeAvustushakuByChangingEndDateToPast()

    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    await hakemustenArviointiPage.navigate(avustushakuID)

    const acceptWithBudget = acceptedBudget ? acceptedBudget : budget

    const projectName = answers.projectName

    if (!projectName) {
      throw new Error('projectName must be set in order to accept avustushaku')
    }

    const hakemusID = await hakemustenArviointiPage.acceptAvustushaku({
      avustushakuID,
      projectName: projectName,
      budget: acceptWithBudget,
      projektikoodi,
    })

    await hakemustenArviointiPage.header.switchToHakujenHallinta()
    await haunTiedotPage.resolveAvustushaku()

    await hakemustenArviointiPage.navigate(avustushakuID)
    await hakemustenArviointiPage.selectValmistelijaForHakemus(hakemusID, ukotettuValmistelija)

    const paatosPage = PaatosPage(page)
    await paatosPage.navigateTo(avustushakuID)
    await paatosPage.sendPaatos()

    await use({ hakemusID, userKey })
  },
})
