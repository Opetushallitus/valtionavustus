import { expect } from '@playwright/test'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { HAKIJA_URL, TEST_Y_TUNNUS, VIRKAILIJA_URL } from '../../utils/constants'
import { muutoshakemusTest } from '../../fixtures/muutoshakemusTest'
import { hakuPath } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { setupBreakpoint } from '../../utils/setupLinks'

muutoshakemusTest('Hakemuksen ulkoasu', async ({ page, avustushakuID, startedHakemus }) => {
  const { hakemusUrl } = startedHakemus

  // `task setup:hakemus` — published open haku + a started application form.
  if (
    setupBreakpoint('hakemus', {
      'Aloitettu hakemus (hakija)': hakemusUrl,
      'Tyhjä hakemuslomake (hakija)': `${HAKIJA_URL}/avustushaku/${avustushakuID}/?lang=fi`,
      'Haku-editori (virkailija)': `${VIRKAILIJA_URL}${hakuPath(avustushakuID)}`,
    })
  )
    return

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
