import { expect } from '@playwright/test'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { TEST_Y_TUNNUS } from '../../utils/constants'
import { muutoshakemusTest } from '../../fixtures/muutoshakemusTest'

muutoshakemusTest('Hakemuslomakkeen ulkoasu', async ({ page, startedHakemus }) => {
  const { hakemusUrl } = startedHakemus
  await page.goto(hakemusUrl)
  const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
  await hakijaAvustusHakuPage.fillInBusinessId(TEST_Y_TUNNUS)

  await muutoshakemusTest.step('Hakemuksella näkyy OPH:n logo', async () => {
    expect(await page.locator('#logo').screenshot()).toMatchSnapshot('oph-logo.png')
  })
})
