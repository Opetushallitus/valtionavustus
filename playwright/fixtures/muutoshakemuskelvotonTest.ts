import { expect, test } from '@playwright/test'
import { HakemustenArviointiPage } from '../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { HakujenHallintaPage } from '../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import moment from 'moment'
import { HakijaAvustusHakuPage } from '../pages/hakija/hakijaAvustusHakuPage'
import { defaultValues } from './defaultValues'
import { PaatosPage } from '../pages/virkailija/hakujen-hallinta/PaatosPage'

export interface MuutoshakemusFixtures {
  finalAvustushakuEndDate: moment.Moment
  avustushakuID: number
  closedAvustushaku: {
    id: number
  }
  submittedHakemus: {
    userKey: string
    arkistointitunnus: string
  }
  acceptedHakemus: {
    hakemusID: number
    userKey: string
  }
}

/**
 * Creates a muutoshakuenabled hakemus with käyttöaika and sisältö, but no budjetti
 */
export const muutoshakemuskelvotonTest = defaultValues.extend<MuutoshakemusFixtures>({
  finalAvustushakuEndDate: moment().subtract(1, 'year'),
  avustushakuID: async ({ page, hakuProps, userCache }, use, testInfo) => {
    expect(userCache).toBeDefined()
    testInfo.setTimeout(testInfo.timeout + 40_000)
    const avustushakuID = await test.step('Create muutoshakukelvoton haku', async () => {
      const hakujenHallintaPage = new HakujenHallintaPage(page)
      const avustushakuID = await hakujenHallintaPage.createMuutoshakemusDisabledHaku(hakuProps)
      return avustushakuID
    })
    await use(avustushakuID)
  },
  submittedHakemus: async ({ avustushakuID, answers, page }, use, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 15_000)

    const userKey = await test.step('Submit hakemus', async () => {
      const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
      await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang)
      const { userKey } = await hakijaAvustusHakuPage.fillAndSendMuutoshakemusEnabledHakemus(
        avustushakuID,
        answers
      )
      return userKey
    })
    const arkistointitunnus = await page.getByTestId('hakemus-arkistointitunnus').innerText()
    use({ userKey, arkistointitunnus })
  },
  closedAvustushaku: async (
    { page, avustushakuID, submittedHakemus, finalAvustushakuEndDate },
    use
  ) => {
    await test.step('Close avustushaku', async () => {
      expect(submittedHakemus).toBeDefined()
      const hakujenHallintaPage = new HakujenHallintaPage(page)
      const haunTiedotPage = await hakujenHallintaPage.navigate(avustushakuID)
      await haunTiedotPage.setEndDate(finalAvustushakuEndDate.format('D.M.YYYY H.mm'))
    })
    await use({ id: avustushakuID })
  },
  acceptedHakemus: async (
    {
      closedAvustushaku,
      page,
      ukotettuValmistelija,
      answers,
      submittedHakemus: { userKey, arkistointitunnus },
      projektikoodi,
    },
    use,
    testInfo
  ) => {
    testInfo.setTimeout(testInfo.timeout + 25_000)

    const avustushakuID = closedAvustushaku.id
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)

    const hakemusID = await test.step(`Hyväksy hakemus ${answers.projectName}`, async () => {
      await hakemustenArviointiPage.navigate(avustushakuID)
      const hakemusID = await hakemustenArviointiPage.acceptAvustushaku({
        avustushakuID,
        projectName: arkistointitunnus,
        projektikoodi,
      })
      return hakemusID
    })

    await test.step('Ratkaise avustushaku', async () => {
      const haunTiedotPage = await hakemustenArviointiPage.header.switchToHakujenHallinta()
      await haunTiedotPage.resolveAvustushaku()

      await hakemustenArviointiPage.navigate(avustushakuID)
      await hakemustenArviointiPage.selectValmistelijaForHakemus(hakemusID, ukotettuValmistelija)
    })

    await test.step('Lähetä päätös', async () => {
      const paatosPage = PaatosPage(page)
      await paatosPage.navigateTo(avustushakuID)
      await paatosPage.sendPaatos()
    })

    await use({ hakemusID, userKey })
  },
})
