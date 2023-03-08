import { expectToBeDefined } from '../utils/util'
import { HakujenHallintaPage } from '../pages/hakujenHallintaPage'
import { expect, test } from '@playwright/test'
import { selvitysTest } from '../fixtures/selvitysTest'

selvitysTest('Selvityspyyntö can be previewed', async ({ page, avustushakuID }) => {
  expectToBeDefined(avustushakuID)

  const hakujenHallintaPage = new HakujenHallintaPage(page)

  await test.step('for väliselvitys', async () => {
    await page.bringToFront()
    const tab = await hakujenHallintaPage.switchToValiselvitysTab()

    await test.step('in finnish', async () => {
      const previewPage = await tab.openFormPreviewFi()

      expect(await previewPage.textContent('h1')).toEqual('Väliselvitys')
      expect(await previewPage.textContent('[id="financing-plan"] h2')).toEqual('Talousarvio')
    })

    await test.step('in swedish', async () => {
      await page.bringToFront()
      const previewPage = await tab.openFormPreviewSv()

      expect(await previewPage.textContent('h1')).toEqual('Mellanredovisning')
      expect(await previewPage.textContent('[id="financing-plan"] h2')).toEqual('Projektets budget')
    })
  })

  await test.step('for loppuselvitys', async () => {
    await page.bringToFront()
    const tab = await hakujenHallintaPage.switchToLoppuselvitysTab()

    await test.step('in finnish', async () => {
      const previewPage = await tab.openFormPreviewFi()

      expect(await previewPage.textContent('h1')).toEqual('Loppuselvitys')
      expect(await previewPage.textContent('[id="financing-plan"] h2')).toEqual('Talousarvio')
    })

    await test.step('in swedish', async () => {
      await page.bringToFront()
      const previewPage = await tab.openFormPreviewSv()

      expect(await previewPage.textContent('h1')).toEqual('Slutredovisning')
      expect(await previewPage.textContent('[id="financing-plan"] h2')).toEqual('Projektets budget')
    })
  })
})
