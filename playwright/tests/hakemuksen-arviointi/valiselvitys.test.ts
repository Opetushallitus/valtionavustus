import { expect, test } from '@playwright/test'
import { ValiselvitysPage } from '../../pages/valiselvitysPage'
import { expectToBeDefined } from '../../utils/util'
import { HakemustenArviointiPage } from '../../pages/hakemustenArviointiPage'
import { väliselvitysTest } from '../../fixtures/väliselvitysTest'

test.describe('Väliselvitys', () => {
  väliselvitysTest(
    'väliselvitys can be accepted',
    async ({ page, avustushakuID , acceptedHakemus, väliselvitysSubmitted}) => {
      expectToBeDefined(väliselvitysSubmitted)
      const arviointi = new HakemustenArviointiPage(page)

      await test.step('väliselvitys is tarkastamatta', async () => {
        await arviointi.navigate(avustushakuID)
        expect(await arviointi.väliselvitysStatus(acceptedHakemus.hakemusID)).toEqual("Tarkastamatta")
      })

      await test.step('tarkasta väliselvitys', async () => {
        const valiselvitysPage = new ValiselvitysPage(page)
        valiselvitysPage.navigateToValiselvitysTab(avustushakuID, acceptedHakemus.hakemusID)
        await page.waitForSelector('[data-test-id="selvitys-email"]')
        await valiselvitysPage.acceptVäliselvitys()
      })

      await test.step('väliselvitys is hyväksytty', async () => {
        await arviointi.navigate(avustushakuID)
        expect(await arviointi.väliselvitysStatus(acceptedHakemus.hakemusID)).toEqual("Hyväksytty")
      })
    }
  )
})