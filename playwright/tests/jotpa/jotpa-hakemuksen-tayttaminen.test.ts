import { expect } from '@playwright/test'
import { JotpaTest } from '../../fixtures/JotpaTest'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { TEST_Y_TUNNUS } from '../../utils/constants'

JotpaTest('Jotpa-hakemuksen täyttäminen', async ({ page, avustushakuID }) => {
  const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)

  await JotpaTest.step('Suomenkielisellä hakemuksella', async () => {
    await hakijaAvustusHakuPage.navigate(avustushakuID, 'fi')
    const hakemusUrl = await hakijaAvustusHakuPage.startApplication(
      avustushakuID,
      'buffy.summers@askjeeves.com'
    )

    await JotpaTest.step('Etusivulla', async () => {
      await JotpaTest.step('Näyttää jotpan suomenkielisen logon', async () => {
        expect(await page.locator('#logo').screenshot()).toMatchSnapshot('jotpa-logo-fi.png')
      })

      await JotpaTest.step('Infopallura on jotpan väreissä', async () => {
        await expect(page.locator('.jotpa-help-icon')).toBeVisible()
      })

      await JotpaTest.step('Luo uusi hakemus nappula on jotpan väreissä', async () => {
        await expect(page.locator('.jotpa-text-button')).toBeVisible()
      })
    })

    await JotpaTest.step('Hakemussivulla', async () => {
      await page.goto(hakemusUrl)
      await hakijaAvustusHakuPage.fillInBusinessId(TEST_Y_TUNNUS)

      await JotpaTest.step('Näyttää jotpan suomenkielisen logon', async () => {
        expect(await page.locator('#logo').screenshot()).toMatchSnapshot('jotpa-logo-fi.png')
      })
    })
  })

  await JotpaTest.step('Ruotsinkielisellä hakemuksella', async () => {
    await hakijaAvustusHakuPage.navigate(avustushakuID, 'sv')
    const hakemusUrl = await hakijaAvustusHakuPage.startApplication(
      avustushakuID,
      'faith.lehane@altavista.com'
    )

    await JotpaTest.step('Etusivulla', async () => {
      await JotpaTest.step('Näyttää jotpan ruotsinkielisen logon', async () => {
        expect(await page.locator('#logo').screenshot()).toMatchSnapshot('jotpa-logo-sv.png')
      })
    })

    await JotpaTest.step('Hakemussivulla', async () => {
      await page.goto(hakemusUrl)
      await hakijaAvustusHakuPage.fillInBusinessId(TEST_Y_TUNNUS)

      await JotpaTest.step('Näyttää jotpan ruotsinkielisen logon', async () => {
        expect(await page.locator('#logo').screenshot()).toMatchSnapshot('jotpa-logo-sv.png')
      })
    })
  })
})
