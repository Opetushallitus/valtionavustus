import { test, expect } from '@playwright/test'
import { JotpaTest } from '../../fixtures/JotpaTest'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { TEST_Y_TUNNUS } from '../../utils/constants'

JotpaTest('Jotpa-hakemuksen täyttäminen', async ({ page, startedHakemus }) => {
  test.fail()
  const { hakemusUrl } = startedHakemus
  await page.goto(hakemusUrl)
  const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
  await hakijaAvustusHakuPage.fillInBusinessId(TEST_Y_TUNNUS)

  await JotpaTest.step('Hakemuksella näkyy Jotpan logo', async () => {
    expect(true).toBe(false)
  })
})
