import { expect } from '@playwright/test'
import { JotpaTest } from '../../fixtures/JotpaTest'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { TEST_Y_TUNNUS } from '../../utils/constants'

JotpaTest('Jotpa-hakemuksen täyttäminen', async ({ page, avustushakuID }) => {
  const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)

  await JotpaTest.step(
    'Suomenkielisellä hakemuksella näkyy suomenkielinen Jotpan logo',
    async () => {
      await hakijaAvustusHakuPage.navigate(avustushakuID, 'fi')
      const hakemusUrl = await hakijaAvustusHakuPage.startApplication(
        avustushakuID,
        'buffy.summers@askjeeves.com'
      )
      await page.goto(hakemusUrl)
      await hakijaAvustusHakuPage.fillInBusinessId(TEST_Y_TUNNUS)

      expect(await page.locator('#logo').screenshot()).toMatchSnapshot('jotpa-logo-fi.png')
    }
  )

  await JotpaTest.step(
    'Ruotsinkielisellä hakemuksella näkyy ruotsinkielinen Jotpan logo',
    async () => {
      await hakijaAvustusHakuPage.navigate(avustushakuID, 'sv')
      const hakemusUrl = await hakijaAvustusHakuPage.startApplication(
        avustushakuID,
        'faith.lehane@altavista.com'
      )
      await page.goto(hakemusUrl)
      await hakijaAvustusHakuPage.fillInBusinessId(TEST_Y_TUNNUS)

      expect(await page.locator('#logo').screenshot()).toMatchSnapshot('jotpa-logo-sv.png')
    }
  )
})
