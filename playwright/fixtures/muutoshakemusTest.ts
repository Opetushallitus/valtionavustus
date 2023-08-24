import { expect, test } from '@playwright/test'
import { HakemustenArviointiPage } from '../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import {
  HakujenHallintaPage,
  hakuPath,
} from '../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import moment from 'moment'
import { HakijaAvustusHakuPage } from '../pages/hakija/hakijaAvustusHakuPage'
import { defaultValues } from './defaultValues'
import { expectToBeDefined } from '../utils/util'
import { PaatosPage } from '../pages/virkailija/hakujen-hallinta/PaatosPage'
import { VIRKAILIJA_URL } from '../utils/constants'
import { Answers } from '../utils/types'

export interface MuutoshakemusFixtures {
  finalAvustushakuEndDate: moment.Moment
  avustushakuID: number
  closedAvustushaku: {
    id: number
  }
  submittedHakemus: {
    userKey: string
  }
  acceptedHakemus: {
    hakemusID: number
    userKey: string
  }
  submitMultipleHakemuses: {}
}

export const submittedHakemusTest = defaultValues.extend<MuutoshakemusFixtures>({
  finalAvustushakuEndDate: moment().subtract(1, 'year'),
  avustushakuID: async ({ page, hakuProps, userCache }, use, testInfo) => {
    expect(userCache).toBeDefined()
    testInfo.setTimeout(testInfo.timeout + 40_000)

    const avustushakuID = await test.step('Create avustushaku', async () => {
      const hakujenHallintaPage = new HakujenHallintaPage(page)
      return await hakujenHallintaPage.createMuutoshakemusEnabledHaku(hakuProps)
    })
    testInfo.annotations.push({
      type: 'avustushaku',
      description: `${VIRKAILIJA_URL}${hakuPath(avustushakuID)}`,
    })
    await use(avustushakuID)
  },
  submittedHakemus: async ({ avustushakuID, answers, page }, use, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 15_000)

    let userKey: string | null = null
    await test.step('Submit hakemus', async () => {
      const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
      await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang)
      userKey = (
        await hakijaAvustusHakuPage.fillAndSendMuutoshakemusEnabledHakemus(avustushakuID, answers)
      ).userKey
    })
    expectToBeDefined(userKey)
    await use({ userKey })
  },
  submitMultipleHakemuses: async ({ avustushakuID, answers, page }, use, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 15_000)

    await test.step('Submit hakemus', async () => {
      const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
      await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang)
      await hakijaAvustusHakuPage.fillAndSendMuutoshakemusEnabledHakemus(avustushakuID, answers)
    })
    await test.step('submit hakemus2', async () => {
      const answers2: Answers = {
        ...answers,
        organization: 'Säädön jatko firma oy',
        projectName: `Säätö jatkuu...`,
        contactPersonEmail: 'erkki2.esimerkki@example.com',
      }
      const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
      await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang)
      await hakijaAvustusHakuPage.fillAndSendMuutoshakemusEnabledHakemus(avustushakuID, answers2)
    })
    await test.step('submit hakemus3', async () => {
      const answers3: Answers = {
        ...answers,
        organization: 'Pieni Hakusivufirma oy',
        projectName: `Pieni säätö`,
        contactPersonEmail: 'erkki3.esimerkki@example.com',
      }
      const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
      await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang)
      await hakijaAvustusHakuPage.fillAndSendMuutoshakemusEnabledHakemus(avustushakuID, answers3)
    })
    await use({})
  },
  closedAvustushaku: async (
    { page, avustushakuID, submittedHakemus, finalAvustushakuEndDate },
    use
  ) => {
    expect(submittedHakemus).toBeDefined()
    await test.step('Close avustushaku', async () => {
      const hakujenHallintaPage = new HakujenHallintaPage(page)
      const haunTiedotPage = await hakujenHallintaPage.navigate(avustushakuID)
      await haunTiedotPage.setEndDate(finalAvustushakuEndDate.format('D.M.YYYY H.mm'))
    })
    await use({ id: avustushakuID })
  },
})

/**
 * Creates a muutoshakuenabled hakemus with käyttöaika and sisältö, but no budjetti
 */
export const muutoshakemusTest = submittedHakemusTest.extend<MuutoshakemusFixtures>({
  acceptedHakemus: async (
    {
      closedAvustushaku,
      page,
      ukotettuValmistelija,
      submittedHakemus: { userKey },
      answers,
      projektikoodi,
      codes,
    },
    use,
    testInfo
  ) => {
    const avustushakuID = closedAvustushaku.id
    testInfo.setTimeout(testInfo.timeout + 25_000)

    const hakemustenArviointiPage = new HakemustenArviointiPage(page)

    let hakemusID: number = 0
    await test.step('Accept hakemus', async () => {
      await hakemustenArviointiPage.navigate(avustushakuID)
      hakemusID = await hakemustenArviointiPage.acceptAvustushaku({
        avustushakuID,
        projectName: answers.projectName,
        projektikoodi,
        codes,
      })
    })

    const hakujenHallintaPage = new HakujenHallintaPage(page)
    await test.step('Resolve avustushaku', async () => {
      const haunTiedotPage = await hakujenHallintaPage.navigate(avustushakuID)
      await haunTiedotPage.resolveAvustushaku()
    })

    await test.step('Add valmistelija for hakemus', async () => {
      await hakemustenArviointiPage.navigate(avustushakuID)
      await hakemustenArviointiPage.selectValmistelijaForHakemus(hakemusID, ukotettuValmistelija)
    })

    await test.step('Send päätökset', async () => {
      const paatosPage = PaatosPage(page)
      await paatosPage.navigateTo(avustushakuID)
      await paatosPage.sendPaatos()
    })

    await use({ hakemusID, userKey })
  },
})

export const unpublishedAvustushakuTest = defaultValues.extend<MuutoshakemusFixtures>({
  finalAvustushakuEndDate: moment().subtract(1, 'year'),
  avustushakuID: async ({ page, hakuProps, userCache }, use, testInfo) => {
    expect(userCache).toBeDefined()
    testInfo.setTimeout(testInfo.timeout + 40_000)

    let avustushakuID: number | null = null
    await test.step('Create avustushaku', async () => {
      const hakujenHallintaPage = new HakujenHallintaPage(page)
      avustushakuID = await hakujenHallintaPage.createUnpublishedMuutoshakemusEnabledHaku(hakuProps)
      await hakujenHallintaPage.waitForSave()
    })
    expectToBeDefined(avustushakuID)
    await use(avustushakuID)
  },
})
