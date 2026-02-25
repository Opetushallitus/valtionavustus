import { expect } from '@playwright/test'
import { defaultValues as test } from '../../fixtures/defaultValues'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { randomAsiatunnus, randomString } from '../../utils/random'
import { expectToBeDefined } from '../../utils/util'

const avustushakuName = `Hakuna matata - haku ${randomString()}`
const hankkeenAlkamispaiva = '20.04.1969'
const hankkeenPaattymispaiva = '29.12.1969'

test('switching between avustushaut', async ({ page, hakuProps, userCache }) => {
  expectToBeDefined(userCache)
  const hakujenHallintaPage = new HakujenHallintaPage(page)
  await test.step('create avustushaku #1', async () => {
    await hakujenHallintaPage.copyEsimerkkihaku()
    await hakujenHallintaPage.fillAvustushaku({
      ...hakuProps,
      avustushakuName,
      hankkeenAlkamispaiva,
      hankkeenPaattymispaiva,
    })
  })
  let avustushakuID: number
  await test.step('create avustushaku #2', async () => {
    avustushakuID = await hakujenHallintaPage.copyEsimerkkihaku()
    await hakujenHallintaPage.fillAvustushaku({
      ...hakuProps,
      avustushakuName: `Makuulla hatata - haku ${randomString()}`,
      registerNumber: randomAsiatunnus(),
    })
  })
  await test.step('assert correct paatos paiva values for avustushaku #2', async () => {
    const paatosPage = await hakujenHallintaPage.commonHakujenHallinta.switchToPaatosTab()
    const paatosLocators = paatosPage.locators
    await expect(paatosLocators.hankkeenAlkamisPaivaLabel).toHaveText(
      'Avustuksen ensimmäinen käyttöpäivä'
    )
    await expect(paatosLocators.hankkeenAlkamisPaiva).toHaveValue(hakuProps.hankkeenAlkamispaiva)
    await expect(paatosLocators.hankkeenPaattymisPaivaLabel).toHaveText(
      'Avustuksen viimeinen käyttöpäivä'
    )
    await expect(paatosLocators.hankkeenPaattymisPaiva).toHaveValue(
      hakuProps.hankkeenPaattymispaiva
    )
  })
  await test.step('switch to hauntiedot and avustushaku #1 to get ready to check paatos tab rendering when switching', async () => {
    expectToBeDefined(avustushakuID)
    await hakujenHallintaPage.navigate(avustushakuID)
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/avustushaku/') && res.status() === 200),
      page.locator(`text="${avustushakuName}"`).click(),
    ])
  })
  await test.step('assert correct paatos paiva values for avustushaku #2', async () => {
    const paatosPage = await hakujenHallintaPage.commonHakujenHallinta.switchToPaatosTab()
    const paatosLocators = paatosPage.locators
    await expect(paatosLocators.hankkeenAlkamisPaivaLabel).toHaveText(
      'Avustuksen ensimmäinen käyttöpäivä'
    )
    await expect(paatosLocators.hankkeenAlkamisPaiva).toHaveValue(hankkeenAlkamispaiva)
    await expect(paatosLocators.hankkeenPaattymisPaivaLabel).toHaveText(
      'Avustuksen viimeinen käyttöpäivä'
    )
    await expect(paatosLocators.hankkeenPaattymisPaiva).toHaveValue(hankkeenPaattymispaiva)
  })
})
