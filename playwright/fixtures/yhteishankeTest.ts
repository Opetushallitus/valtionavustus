import { expect } from '@playwright/test'
import { defaultValues } from './defaultValues'
import {
  HakujenHallintaPage,
  hakuPath,
} from '../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { HakijaAvustusHakuPage } from '../pages/hakija/hakijaAvustusHakuPage'
import { TEST_Y_TUNNUS, VIRKAILIJA_URL } from '../utils/constants'
import { expectToBeDefined } from '../utils/util'
import organizationsFormJson from './avustushaku-with-organizations.json'

export interface YhteishankeFixtures {
  avustushakuID: number
  submittedHakemusUrl: string
}

const hakulomake = JSON.stringify(organizationsFormJson)

export const yhteishankeTest = defaultValues.extend<YhteishankeFixtures>({
  avustushakuID: async ({ page, hakuProps, userCache }, use, testInfo) => {
    expect(userCache).toBeDefined()
    testInfo.setTimeout(testInfo.timeout + 40_000)

    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const avustushakuID = await hakujenHallintaPage.createPublishedAvustushaku(
      hakuProps,
      hakulomake
    )

    testInfo.annotations.push({
      type: 'avustushaku',
      description: `${VIRKAILIJA_URL}${hakuPath(avustushakuID)}`,
    })
    await use(avustushakuID)
  },
  submittedHakemusUrl: async ({ avustushakuID, answers, page }, use, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 30_000)
    const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
    await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang)
    const hakemusUrl = await hakijaAvustusHakuPage.startApplication(
      avustushakuID,
      answers.contactPersonEmail
    )
    expectToBeDefined(hakemusUrl)

    await page.goto(hakemusUrl)
    await hakijaAvustusHakuPage.fillApplication(answers, TEST_Y_TUNNUS)

    testInfo.annotations.push({
      type: 'hakemus',
      description: hakemusUrl,
    })
    await use(hakemusUrl)
  },
})
