import { expect } from '@playwright/test'
import { HakujenHallintaPage } from '../pages/hakujenHallintaPage'
import { selvitysTest as test } from '../fixtures/selvitysTest'
import { expectToBeDefined } from '../utils/util'

test('Modifying päätös should not affect vali- and loppuselvitys updated at timestamps', async ({
  page,
  avustushakuID,
}) => {
  const hakujenHallinta = new HakujenHallintaPage(page)
  await hakujenHallinta.navigate(avustushakuID)

  const paatosPage = await hakujenHallinta.commonHakujenHallinta.switchToPaatosTab()
  const originalPaatosTimestamp = await paatosPage.locators.paatosUpdatedAt.textContent()

  const valiselvitysPage = await hakujenHallinta.commonHakujenHallinta.switchToValiselvitysTab()
  const originalValiselvitysTimestamp = await valiselvitysPage.locators.updatedAt.textContent()
  expectToBeDefined(originalValiselvitysTimestamp)

  await hakujenHallinta.switchToLoppuselvitysTab()
  const originalLoppuselvitysTimestamp = await hakujenHallinta.loppuselvitysUpdatedAt.textContent()

  await test.step('modify paatos', async () => {
    const paatosPage = await hakujenHallinta.commonHakujenHallinta.switchToPaatosTab()
    await paatosPage.locators.taustaa.fill('Burger Time')
    await hakujenHallinta.waitForSave()
  })

  await test.step('päätös modified timestamp has changed', async () => {
    const paatosPage = await hakujenHallinta.commonHakujenHallinta.switchToPaatosTab()
    const newPaatosTimestamp = await paatosPage.locators.paatosUpdatedAt.textContent()
    expect(newPaatosTimestamp).not.toEqual(originalPaatosTimestamp)
  })

  await test.step('loppuselvitys modified timestamp has not changed', async () => {
    await hakujenHallinta.switchToLoppuselvitysTab()
    const newLoppuselvitysTimestamp = await hakujenHallinta.loppuselvitysUpdatedAt.textContent()
    expect(newLoppuselvitysTimestamp).toEqual(originalLoppuselvitysTimestamp)
  })

  await test.step('väliselvitys modified timestamp has not changed', async () => {
    const valiselvitysPage = await hakujenHallinta.commonHakujenHallinta.switchToValiselvitysTab()
    await expect(valiselvitysPage.locators.updatedAt).toHaveText(originalValiselvitysTimestamp)
  })
})
