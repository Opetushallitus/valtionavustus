import { test } from '@playwright/test'
import moment from 'moment'

import { HakuProps, parseDate } from '../pages/hakujenHallintaPage'
import { KoodienhallintaPage } from '../pages/koodienHallintaPage'
import { randomAsiatunnus, randomString } from '../utils/random'
import { VaCodeValues } from '../utils/types'
import { switchUserIdentityTo } from '../utils/util'

type DefaultValueFixtures = {
  codes: VaCodeValues
  hakuProps: HakuProps
}

export const defaultValues = test.extend<DefaultValueFixtures>({
  codes: async ({page}, use, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 20_000)

    await switchUserIdentityTo(page, "valtionavustus")
    const koodienHallintaPage = new KoodienhallintaPage(page)
    const codes = await koodienHallintaPage.createRandomCodeValues()
    await use(codes)
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