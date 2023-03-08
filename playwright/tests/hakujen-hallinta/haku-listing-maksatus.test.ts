import { expect } from '@playwright/test'
import moment from 'moment'
import { muutoshakemusTest } from '../../fixtures/muutoshakemusTest'
import { HakujenHallintaPage } from '../../pages/hakujenHallintaPage'
import { MaksatuksetPage } from '../../pages/maksatuksetPage'
import { expectToBeDefined } from '../../utils/util'

muutoshakemusTest(
  'Hakujen hallinta listing Maksatus column',
  async ({ page, avustushakuID, acceptedHakemus, avustushakuName }) => {
    expectToBeDefined(acceptedHakemus)

    await muutoshakemusTest.step('should be empty when maksatukset not sent yet', async () => {
      const hakujenHallintaPage = new HakujenHallintaPage(page)
      await hakujenHallintaPage.navigate(avustushakuID)
      const maksatuksetCell = hakujenHallintaPage
        .hakuListingTableSelectors()
        .maksatukset.cellValue(avustushakuName)

      await expect(maksatuksetCell).toHaveText('-')
    })

    await muutoshakemusTest.step('sending maksatukset', async () => {
      const maksatuksetPage = MaksatuksetPage(page)
      await maksatuksetPage.goto(avustushakuName)
      await maksatuksetPage.fillMaksueranTiedotAndSendMaksatukset()
    })

    await muutoshakemusTest.step("should have today's date after maksatukset sent", async () => {
      const hakujenHallintaPage = new HakujenHallintaPage(page)
      await hakujenHallintaPage.navigate(avustushakuID)
      const maksatuksetCell = hakujenHallintaPage
        .hakuListingTableSelectors()
        .maksatukset.cellValue(avustushakuName)

      const today = moment().format('DD.MM.YY')
      await expect(maksatuksetCell).toHaveText(today)
    })
  }
)
