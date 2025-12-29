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
import { TEST_Y_TUNNUS, VIRKAILIJA_URL } from '../utils/constants'
import { Answers } from '../utils/types'
import muutoshakemusEnabledHakuLomakeJson from './prod.hakulomake.json'
import { Email, getRejectedPäätösEmails, waitUntilMinEmails } from '../utils/emails'

export interface MuutoshakemusFixtures {
  finalAvustushakuEndDate: moment.Moment
  businessId: string | null
  loppuselvitysForm: string | null
  valiselvitysForm: string | null
  avustushakuID: number
  closedAvustushaku: {
    id: number
  }
  startedHakemus: {
    hakemusUrl: string
  }
  filledHakemus: {
    hakemusUrl: string
  }
  submittedHakemus: {
    userKey: string
  }
  acceptedHakemus: {
    hakemusID: number
    userKey: string
  }
  rejectedHakemus: {
    hakemusID: number
    userKey: string
  }
  rejectedHakemusEmails: {
    emails: Promise<Email[]>
  }
  submitMultipleHakemuses: {}
  hakulomake: string
}

export const submittedHakemusTest = defaultValues.extend<MuutoshakemusFixtures>({
  finalAvustushakuEndDate: moment().subtract(1, 'year'),
  hakulomake: JSON.stringify(muutoshakemusEnabledHakuLomakeJson),
  businessId: TEST_Y_TUNNUS,
  loppuselvitysForm: null,
  valiselvitysForm: null,
  avustushakuID: async (
    { page, hakuProps, userCache, loppuselvitysForm, valiselvitysForm, hakulomake },
    use,
    testInfo
  ) => {
    expect(userCache).toBeDefined()
    testInfo.setTimeout(testInfo.timeout + 40_000)

    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const avustushakuID = await hakujenHallintaPage.createPublishedAvustushaku(
      hakuProps,
      hakulomake
    )

    if (valiselvitysForm) {
      await test.step('Set väliselvitys form', async () => {
        const valiselvitysTab = await hakujenHallintaPage.switchToValiselvitysTab()
        await valiselvitysTab.changeLomakeJson(valiselvitysForm)
        await valiselvitysTab.saveForm()
      })
    }

    if (loppuselvitysForm) {
      await test.step('Set loppuselvitys form', async () => {
        const loppuselvitysTab = await hakujenHallintaPage.switchToLoppuselvitysTab()
        await loppuselvitysTab.changeLomakeJson(loppuselvitysForm)
        await loppuselvitysTab.saveForm()
      })
    }

    testInfo.annotations.push({
      type: 'avustushaku',
      description: `${VIRKAILIJA_URL}${hakuPath(avustushakuID)}`,
    })
    await use(avustushakuID)
  },
  startedHakemus: async ({ avustushakuID, answers, page }, use, testInfo) => {
    const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
    await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang)
    const hakemusUrl = await hakijaAvustusHakuPage.startApplication(
      avustushakuID,
      answers.contactPersonEmail
    )

    testInfo.annotations.push({
      type: 'hakemus',
      description: hakemusUrl,
    })
    await use({ hakemusUrl })
  },
  filledHakemus: async ({ answers, businessId, startedHakemus, page }, use) => {
    const { hakemusUrl } = startedHakemus
    await page.goto(hakemusUrl)
    const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
    await hakijaAvustusHakuPage.fillApplication(answers, businessId)
    await hakijaAvustusHakuPage.fillMuutoshakemusEnabledHakemus(answers)
    await use({ hakemusUrl })
  },
  submittedHakemus: async ({ page, filledHakemus }, use, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 15_000)

    await page.goto(filledHakemus.hakemusUrl)
    const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
    const { userKey } = await hakijaAvustusHakuPage.submitApplication()

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
    await hakemustenArviointiPage.navigate(avustushakuID)
    let hakemusID: number = 0
    await test.step('Accept hakemus', async () => {
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
    })
    await test.step('Add valmistelija for hakemus', async () => {
      await hakemustenArviointiPage.closeHakemusDetails()
      await hakemustenArviointiPage.selectValmistelijaForHakemus(hakemusID, ukotettuValmistelija)
    })

    const hakujenHallintaPage = new HakujenHallintaPage(page)
    await test.step('Resolve avustushaku', async () => {
      const haunTiedotPage = await hakujenHallintaPage.navigate(avustushakuID)
      await haunTiedotPage.resolveAvustushaku()
    })

    await test.step('Send päätökset', async () => {
      const paatosPage = PaatosPage(page)
      await paatosPage.navigateTo(avustushakuID)
      await paatosPage.sendPaatos()
    })

    await use({ hakemusID, userKey })
  },
  rejectedHakemus: async (
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
    await test.step('reject hakemus', async () => {
      const projectName = answers.projectName
      if (!projectName) {
        throw new Error('projectName must be set in order to select hakemus')
      }
      await hakemustenArviointiPage.navigate(avustushakuID)
      await hakemustenArviointiPage.selectHakemusFromList(projectName)
      hakemusID = await hakemustenArviointiPage.getHakemusID()

      await hakemustenArviointiPage.selectProject(projektikoodi, codes)
      await expect(hakemustenArviointiPage.arviointiTabLocators().taTili.value).toContainText(
        'Ammatillinen koulutus'
      )
      await hakemustenArviointiPage.rejectHakemus()
      await hakemustenArviointiPage.waitForSave()
    })

    const hakujenHallintaPage = new HakujenHallintaPage(page)
    await test.step('Resolve avustushaku', async () => {
      const haunTiedotPage = await hakujenHallintaPage.navigate(avustushakuID)
      await haunTiedotPage.resolveAvustushaku()
    })

    await test.step('Add valmistelija for hakemus', async () => {
      await hakemustenArviointiPage.navigate(avustushakuID)
      await hakemustenArviointiPage.locators().poistaTilaRajaus.click()
      await hakemustenArviointiPage.selectValmistelijaForHakemus(hakemusID, ukotettuValmistelija)
    })

    await test.step('Send päätökset', async () => {
      const paatosPage = PaatosPage(page)
      await paatosPage.navigateTo(avustushakuID)
      await paatosPage.sendPaatos()
    })

    await use({ hakemusID, userKey })
  },
  rejectedHakemusEmails: async ({ rejectedHakemus }, use) => {
    const { hakemusID } = rejectedHakemus
    const hakemusRejectionEmails = waitUntilMinEmails(getRejectedPäätösEmails, 1, hakemusID)
    await use({ emails: hakemusRejectionEmails })
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
