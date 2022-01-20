import { expect, test } from '@playwright/test'
import { ValiselvitysPage } from '../../pages/valiselvitysPage'
import { expectToBeDefined } from '../../utils/util'
import { HakemustenArviointiPage } from '../../pages/hakemustenArviointiPage'
import { väliselvitysTest } from '../../fixtures/väliselvitysTest'
import { getValiselvitysEmails } from '../../../test/test-util'

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

      await test.step('väliselvitys accepted email is sent to primary and organization emails', async () => {
        const emails = await getValiselvitysEmails(acceptedHakemus.hakemusID)
        const expected = ["erkki.esimerkki@example.com", "akaan.kaupunki@akaa.fi"]
        expect(emails[0]["to-address"].every(addr => expected.includes(addr))).toBeTruthy()
      })

      await test.step('väliselvitys is hyväksytty', async () => {
        await arviointi.navigate(avustushakuID)
        expect(await arviointi.väliselvitysStatus(acceptedHakemus.hakemusID)).toEqual("Hyväksytty")
      })
    }
  )
})
