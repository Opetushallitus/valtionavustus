import { expect } from '@playwright/test'
import { defaultValues as test } from '../../fixtures/defaultValues'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { randomString } from '../../utils/random'
import { expectToBeDefined } from '../../utils/util'
import moment from 'moment'

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
    await hakujenHallintaPage.selectRaportointilaji(0, 'Avustuspäätökset')
    expect(await hakujenHallintaPage.page.getByTestId(`asha-tunnus-0`).isEnabled()).toBe(true)
    expect(await hakujenHallintaPage.page.getByTestId(`lisatiedot-0`).isEnabled()).toBe(true)
  })

  await test.step('Cannot fill duplicate raportointilaji', async () => {
    const laji = {
      raportointilaji: 'Muu raportti',
      maaraaika: moment().format('DD.MM.YYYY'),
      ashaTunnus: 'pasha-1',
      lisatiedot: '',
    }

    await hakujenHallintaPage.fillRaportointiVelvoitteet([laji])
    const selectModalSelector = await hakujenHallintaPage.openRaportointilajiSelector(1)

    const duplicateSelectOption = await page
      .locator(selectModalSelector)
      .getByText(laji.raportointilaji)

    // https://github.com/JedWatson/react-select/issues/4195
    await expect(duplicateSelectOption).toHaveAttribute('aria-disabled', 'true')
  })

  await test.step('cannot be edited in published mode', async () => {
    await hakujenHallintaPage.createMuutoshakemusEnabledHaku(hakuProps)
    expect(await hakujenHallintaPage.page.getByTestId(`asha-tunnus-0`).isEnabled()).toBe(false)
    expect(await hakujenHallintaPage.page.getByTestId(`lisatiedot-0`).isEnabled()).toBe(false)
  })
})
