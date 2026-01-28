import { expect, test } from './baseTest'
import moment from 'moment'

import { HakuProps, parseDate } from '../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { KoodienhallintaPage } from '../pages/virkailija/koodienHallintaPage'
import { answers, swedishAnswers, VIRKAILIJA_URL } from '../utils/constants'
import { randomAsiatunnus, randomString } from '../utils/random'
import { Answers, VaCodeValues } from '../utils/types'
import { expectToBeDefined, switchUserIdentityTo } from '../utils/util'
import { EnvironmentApiResponse } from '../../soresu-form/web/va/types/environment'
import { Talousarviotili } from '../../va-virkailija/web/va/koodienhallinta-page/types'
import { randomInt } from 'crypto'

export type DefaultValueFixtures = {
  codes: VaCodeValues
  projektikoodi: string
  talousarviotili: Talousarviotili
  randomName: string
  avustushakuName: string
  hakuProps: HakuProps
  answers: Answers
  swedishAnswers: Answers
  ukotettuValmistelija: string
  arviointi: {
    projektikoodi: string
  }
  userCache: {}
  environment: EnvironmentApiResponse
}

type WorkerScopedDefaultValueFixtures = {
  defaultCodes: {
    codes: VaCodeValues
    tatili: Talousarviotili
  }
}

/** Default values created only once (per worker) to save time */
const workerScopedDefaultValues = test.extend<{}, WorkerScopedDefaultValueFixtures>({
  defaultCodes: [
    async ({ browser }, use) => {
      let codes: VaCodeValues | null = null
      const koodienhallintaContext = await browser.newContext()
      const page = await koodienhallintaContext.newPage()
      await switchUserIdentityTo(page, 'valtionavustus')
      const koodienHallintaPage = KoodienhallintaPage(page)
      await test.step('Create koodisto', async () => {
        codes = await koodienHallintaPage.createRandomCodeValues()
      })
      const tatili = {
        name: `TA-tili ${randomString()}`,
        year: 2022,
        code: `29.10.30.20.${randomInt(0, 99)}.${randomInt(0, 99)}`,
        amount: 420,
      }
      let createdCode: Talousarviotili
      await test.step('create talousarviotili', async () => {
        await koodienHallintaPage.switchToTatilitTab()
        const row = koodienHallintaPage.page.locator(`[data-test-id="${tatili.name}"]`)
        const taForm = koodienHallintaPage.taTilit.form
        await taForm.year.input.fill(String(tatili.year))
        await taForm.code.input.fill(tatili.code)
        await taForm.name.input.fill(tatili.name)
        await taForm.amount.input.fill(String(tatili.amount))
        const [res] = await Promise.all([
          page.waitForResponse(`${VIRKAILIJA_URL}/api/talousarviotilit/`),
          taForm.submitBtn.click(),
        ])
        createdCode = await res.json()
        expect(createdCode).toEqual(expect.objectContaining(tatili))
        await expect(row).toBeVisible()
      })
      await page.close()
      expectToBeDefined(codes)
      await use({ codes, tatili: createdCode! })
    },
    { scope: 'worker' },
  ],
})

export const defaultValues = workerScopedDefaultValues.extend<DefaultValueFixtures>({
  answers,
  swedishAnswers,
  codes: async ({ defaultCodes }, use) => {
    await use(defaultCodes.codes)
  },
  projektikoodi: async ({ codes }, use) => {
    const project = codes.project[codes.project.length - 1]
    expectToBeDefined(project)
    await use(project)
  },
  talousarviotili: async ({ defaultCodes }, use) => {
    await use(defaultCodes.tatili)
  },
  randomName: async ({}, use) => {
    const randomName = randomString()
    await use(randomName)
  },
  environment: async ({ page }, use) => {
    const res = await page.request.get(`${VIRKAILIJA_URL}/environment`)
    await expect(res).toBeOK()
    const environment = await res.json()
    await use(environment)
  },
  avustushakuName: async ({ randomName }, use, testInfo) => {
    await use(
      `Testiavustushaku (${testInfo.title} ${randomName} - ${moment(new Date()).format(
        'YYYY-MM-DD HH:mm:ss.SSSS'
      )}`
    )
  },
  hakuProps: async ({ codes, talousarviotili, avustushakuName, randomName }, use) => {
    const nextYear = new Date().getFullYear() + 1
    await use({
      avustushakuName,
      randomName,
      hakuaikaStart: parseDate('1.1.1970 0.00'),
      hakuaikaEnd: parseDate(`31.12.${nextYear} 23.59`),
      hankkeenAlkamispaiva: '20.04.1969',
      hankkeenPaattymispaiva: '20.04.4200',
      registerNumber: randomAsiatunnus(),
      vaCodes: codes,
      talousarviotili,
      selectionCriteria: [],
      raportointivelvoitteet: [],
      lainsaadanto: [],
      hakemusFields: [],
    })
  },
  ukotettuValmistelija: '_ valtionavustus',
  userCache: async ({ page }, use) => {
    await test.step('populate user cache', async () => {
      const users = [
        {
          'person-oid': '1.2.246.562.24.15653262222',
          'first-name': '_',
          surname: 'valtionavustus',
          email: 'santeri.horttanainen@reaktor.com',
          lang: 'fi',
          privileges: ['va-admin'],
        },
        {
          'person-oid': '1.2.246.562.24.99000000001',
          'first-name': 'Päivi',
          surname: 'Pääkäyttäjä',
          email: 'paivi.paakayttaja@example.com',
          lang: 'fi',
          privileges: ['va-admin'],
        },
        {
          'person-oid': '1.2.246.562.24.99000000002',
          'first-name': 'Viivi',
          surname: 'Virkailija',
          email: 'viivi.virkailja@exmaple.com',
          lang: 'fi',
          privileges: ['va-user'],
        },
        {
          'person-oid': '1.2.246.562.24.99000000003',
          'first-name': 'Jotpa',
          surname: 'Käyttäjä',
          email: 'jotpa.kayttaja@jotpa.fi',
          lang: 'fi',
          privileges: ['va-admin'],
        },
      ]
      const response = await page.request.post(`${VIRKAILIJA_URL}/api/test/user-cache`, {
        data: users,
      })
      await expect(response).toBeOK()
    })
    await use({})
  },
})
