import { expect } from '@playwright/test'
import { defaultValues as test } from '../../fixtures/defaultValues'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { randomString } from '../../utils/random'
import { expectToBeDefined } from '../../utils/util'

test('raportointivelvoite', async ({ page, hakuProps, userCache }) => {
  expectToBeDefined(userCache)
  const hakujenHallintaPage = new HakujenHallintaPage(page)
  await test.step('can be edited in draft mode', async () => {
    await hakujenHallintaPage.copyEsimerkkihaku()
    await hakujenHallintaPage.fillAvustushaku({
      ...hakuProps,
      avustushakuName: `Raportointivelvoitteet - haku ${randomString()}`,
      hankkeenAlkamispaiva: '17.10.2023',
      hankkeenPaattymispaiva: '17.11.2023',
    })
    expect(await hakujenHallintaPage.page.getByTestId(`asha-tunnus-0`).isEnabled()).toBe(true)
    expect(await hakujenHallintaPage.page.getByTestId(`lisatiedot-0`).isEnabled()).toBe(true)
  })
  await test.step('cannot be edited in published mode', async () => {
    await hakujenHallintaPage.createMuutoshakemusEnabledHaku(hakuProps)
    expect(await hakujenHallintaPage.page.getByTestId(`asha-tunnus-0`).isEnabled()).toBe(false)
    expect(await hakujenHallintaPage.page.getByTestId(`lisatiedot-0`).isEnabled()).toBe(false)
  })
})
