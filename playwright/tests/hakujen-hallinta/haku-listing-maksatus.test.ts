import { expect } from '@playwright/test'
import moment from 'moment'
import { muutoshakemusTest } from '../../fixtures/muutoshakemusTest'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { MaksatuksetPage } from '../../pages/virkailija/hakujen-hallinta/maksatuksetPage'
import { expectToBeDefined } from '../../utils/util'

muutoshakemusTest(
  'Hakujen hallinta listing Maksatus column',
  async ({ page, avustushakuID, acceptedHakemus, avustushakuName }) => {
    expectToBeDefined(acceptedHakemus)
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const haunTiedotPage = await hakujenHallintaPage.navigate(avustushakuID)

    await muutoshakemusTest.step('should be empty when maksatukset not sent yet', async () => {
      const maksatuksetCell =
        haunTiedotPage.common.locators.hakuListingTable.maksatukset.cellValue(avustushakuName)

      await expect(maksatuksetCell).toHaveText('-')
    })

    await muutoshakemusTest.step('sending maksatukset', async () => {
      const maksatuksetPage = MaksatuksetPage(page)
      await maksatuksetPage.goto(avustushakuName)
      await maksatuksetPage.fillMaksueranTiedotAndSendMaksatukset()
    })

    await muutoshakemusTest.step("should have today's date after maksatukset sent", async () => {
      await hakujenHallintaPage.navigate(avustushakuID)
      const maksatuksetCell =
        haunTiedotPage.common.locators.hakuListingTable.maksatukset.cellValue(avustushakuName)

      const today = moment().format('DD.MM.YY')
      await expect(maksatuksetCell).toHaveText(today)
    })
  }
)
