import { Answers } from '../utils/types'
import { muutoshakemusTest } from './muutoshakemusTest'
import { HakijaAvustusHakuPage } from '../pages/hakija/hakijaAvustusHakuPage'
import { expectToBeDefined } from '../utils/util'
import { HakemustenArviointiPage } from '../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'

interface Fixtures {
  secondAnswers: Answers
  acceptedHakemukset: {
    hakemusID: number
    secondHakemusID: number
  }
}

export const twoAcceptedHakemusTest = muutoshakemusTest.extend<Fixtures>({
  secondAnswers: async ({ answers }, use) => {
    await use({
      ...answers,
      projectName: 'Projekti 2',
      contactPersonEmail: 'erkki2.esimerkki@example.com',
    })
  },
  submittedHakemus: async ({ avustushakuID, answers, secondAnswers, page }, use) => {
    const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
    await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang)
    const userKey = await hakijaAvustusHakuPage.fillAndSendMuutoshakemusEnabledHakemus(
      avustushakuID,
      answers
    )
    await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang)
    await hakijaAvustusHakuPage.fillAndSendMuutoshakemusEnabledHakemus(avustushakuID, secondAnswers)
    await use(userKey)
  },
  acceptedHakemukset: async (
    {
      closedAvustushaku,
      page,
      answers,
      secondAnswers,
      avustushakuID,
      projektikoodi,
      codes,
      ukotettuValmistelija,
    },
    use
  ) => {
    expectToBeDefined(closedAvustushaku)
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    await hakemustenArviointiPage.navigate(avustushakuID)
    let hakemusID = 0
    let secondHakemusID = 0
    await twoAcceptedHakemusTest.step('accept first', async () => {
      const projectName = answers.projectName
      if (!projectName) {
        throw new Error('projectName must be set in order to accept avustushaku')
      }
      hakemusID = await hakemustenArviointiPage.acceptAvustushaku({
        avustushakuID,
        projectName,
        projektikoodi,
        codes,
      })
      await hakemustenArviointiPage.closeHakemusDetails()
      await hakemustenArviointiPage.selectValmistelijaForHakemus(hakemusID, ukotettuValmistelija)
    })
    await twoAcceptedHakemusTest.step('accept second', async () => {
      const projectName = secondAnswers.projectName
      if (!projectName) {
        throw new Error('projectName must be set in order to accept avustushaku')
      }
      secondHakemusID = await hakemustenArviointiPage.acceptAvustushaku({
        avustushakuID,
        projectName,
        projektikoodi,
        codes,
      })
      await hakemustenArviointiPage.closeHakemusDetails()
      await hakemustenArviointiPage.selectValmistelijaForHakemus(
        secondHakemusID,
        ukotettuValmistelija
      )
    })
    await use({
      hakemusID,
      secondHakemusID,
    })
  },
})
