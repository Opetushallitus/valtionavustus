import { expect } from '@playwright/test'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { TEST_Y_TUNNUS } from '../../utils/constants'
import { muutoshakemusTest } from '../../fixtures/muutoshakemusTest'

muutoshakemusTest('Hakemuksen ulkoasu', async ({ page, startedHakemus }) => {
  const { hakemusUrl } = startedHakemus

  await muutoshakemusTest.step('Hakemuksen etusivulla näkyy OPH:n logo', async () => {
    expect(await page.locator('#logo').screenshot()).toMatchSnapshot('oph-logo.png')
  })

  await muutoshakemusTest.step('Hakemuksen etusivulla näkyy OPH:n favicon', async () => {
    await expect(page.locator('#favicon')).toHaveAttribute('href', '/favicon.ico')
  })

  await muutoshakemusTest.step('Hakemuslomakkeella näkyy OPH:n logo', async () => {
    await page.goto(hakemusUrl)
    const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
    await hakijaAvustusHakuPage.fillInBusinessId(TEST_Y_TUNNUS)

    expect(await page.locator('#logo').screenshot()).toMatchSnapshot('oph-logo.png')
  })
})
