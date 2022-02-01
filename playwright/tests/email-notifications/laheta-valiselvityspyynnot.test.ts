import { test, expect, Page } from '@playwright/test'

import { VIRKAILIJA_URL } from '../../utils/constants'
import { väliselvitysTest } from '../../fixtures/väliselvitysTest'
// import { HakujenHallintaPage } from '../../pages/hakujenHallintaPage'
import { getLahetaValiselvityspyynnotEmails } from '../../utils/emails'
import { expectToBeDefined } from '../../utils/util'

test.describe("send-valiselityspyynnot", () => {
  väliselvitysTest('virkailija notifications', async ({page, avustushakuID, acceptedHakemus}) => {
    expectToBeDefined(acceptedHakemus)

    await test.step('are not sent if valiselvitysdate is not set', async () => {
       
      await sendLahetaValiselvityspyynnotNotifications(page)

      const emailsAfter = await getLahetaValiselvityspyynnotEmails(avustushakuID)
      expect(emailsAfter).toHaveLength(0)
    })

  // is send 6 months before valiselvitysdate
  // is not send until paatos has been send
  })
})

const sendLahetaValiselvityspyynnotNotifications = (page: Page) =>
  page.request.post(`${VIRKAILIJA_URL}/api/test/send-laheta-valiselvityspyynnot-notifications`, { failOnStatusCode: true })

// async function setValiselvitysDate(page: Page, avustushakuID: number, value: string) {
//   const hakujenHallinta = new HakujenHallintaPage(page)
//   await hakujenHallinta.navigateToPaatos(avustushakuID)
//   await hakujenHallinta.setValiselvitysDate(value)
//   await hakujenHallinta.waitForSave()
// }
