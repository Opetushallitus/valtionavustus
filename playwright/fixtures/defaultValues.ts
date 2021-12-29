import { test } from '@playwright/test'
import moment from 'moment'

import { HakuProps, parseDate } from '../pages/hakujenHallintaPage'
import { KoodienhallintaPage } from '../pages/koodienHallintaPage'
import { answers } from '../utils/constants'
import { randomAsiatunnus, randomString } from '../utils/random'
import { Answers, VaCodeValues } from '../utils/types'
import { switchUserIdentityTo } from '../utils/util'

type DefaultValueFixtures = {
  codes: VaCodeValues
  hakuProps: HakuProps
  answers: Answers
}

type WorkerScopedDefaultValueFixtures = {
  defaultCodes: VaCodeValues
}

/** Default values created only once (per worker) to save time */
const workerScopedDefaultValues = test.extend<{}, WorkerScopedDefaultValueFixtures>({
  defaultCodes: [async ({browser}, use) => {
    const page = await browser.newPage()

    await switchUserIdentityTo(page, "valtionavustus")
    const koodienHallintaPage = new KoodienhallintaPage(page)
    const codes = await koodienHallintaPage.createRandomCodeValues()
    use(codes)

    await page.close()
  }, { scope: 'worker' }],
})

export const defaultValues = workerScopedDefaultValues.extend<DefaultValueFixtures>({
  answers,
  codes: async ({defaultCodes}, use) => {
    use(defaultCodes)
  },
  hakuProps: ({ codes }, use, testInfo) => {
    const nextYear = (new Date()).getFullYear() + 1
    use({
      avustushakuName: `Testiavustushaku (${testInfo.title} ${randomString()} - ${moment(new Date()).format('YYYY-MM-DD hh:mm:ss:SSSS')}`,
      hakuaikaStart: parseDate('1.1.1970 0.00'),
      hakuaikaEnd: parseDate(`31.12.${nextYear} 23.59`),
      hankkeenAlkamispaiva: '20.04.1969',
      hankkeenPaattymispaiva: '20.04.4200',
      registerNumber: randomAsiatunnus(),
      vaCodes: codes,
    })
  },
})