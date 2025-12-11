import path from 'node:path'
import fs from 'node:fs/promises'
import { expect } from '@playwright/test'
import { defaultValues as test } from '../../fixtures/defaultValues'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { expectToBeDefined } from '../../utils/util'
import moment from 'moment'
import { HaunTiedotPage } from '../../pages/virkailija/hakujen-hallinta/HaunTiedotPage'

test('raportointivelvoite', async ({ page, hakuProps, userCache }, testInfo) => {
  testInfo.setTimeout(testInfo.timeout + 20_000)
  expectToBeDefined(userCache)
  const hakujenHallintaPage = new HakujenHallintaPage(page)
  const laji = {
    raportointilaji: 'Avustuspäätökset',
    maaraaika: moment().format('DD.MM.YYYY'),
    ashaTunnus: 'pasha-1',
    lisatiedot: '',
  }
  await test.step('can be edited in draft mode', async () => {
    const esimerkkiHakuWithContactDetails = await fs.readFile(
      path.join(__dirname, '../../fixtures/avustushaku-with-contact-details.json'),
      'utf8'
    )

    await hakujenHallintaPage.createHakuWithLomakeJson(esimerkkiHakuWithContactDetails, hakuProps)
    await hakujenHallintaPage.commonHakujenHallinta.switchToHaunTiedotTab()

    await hakujenHallintaPage.fillAvustushaku({
      ...hakuProps,
      raportointivelvoitteet: [laji],
    })
    await expect(hakujenHallintaPage.page.getByTestId(`asha-tunnus-0`)).toBeEnabled()
    await hakujenHallintaPage.page.getByTestId(`lisatiedot-0`).fill('lisää tietoa')
    await hakujenHallintaPage.waitForSave()
  })

  await test.step('Cannot fill duplicate raportointilaji', async () => {
    const selectModalSelector = await hakujenHallintaPage.toggleRaportointilajiSelector(1)
    const duplicateSelectOption = page.locator(selectModalSelector).getByText(laji.raportointilaji)
    // https://github.com/JedWatson/react-select/issues/4195
    await expect(duplicateSelectOption).toHaveAttribute('aria-disabled', 'true')
    await hakujenHallintaPage.toggleRaportointilajiSelector(1)
  })

  await test.step('cannot be edited in published mode', async () => {
    await hakujenHallintaPage.fillRaportointivelvoite(
      {
        raportointilaji: 'Loppuraportti',
        maaraaika: moment().format('DD.MM.YYYY'),
        ashaTunnus: 'pasha-2',
        lisatiedot: 'lisätiedot 2',
      },
      1
    )
    const hauntiedot = HaunTiedotPage(page)
    await hauntiedot.publishAvustushaku()
    await expect(hakujenHallintaPage.page.getByTestId(`asha-tunnus-0`)).toHaveValue('pasha-1')
    await expect(hakujenHallintaPage.page.getByTestId(`asha-tunnus-0`)).toBeDisabled()
    await expect(hakujenHallintaPage.page.getByTestId(`lisatiedot-0`)).toHaveValue('lisää tietoa')
    await expect(hakujenHallintaPage.page.getByTestId(`lisatiedot-0`)).toBeDisabled()

    await expect(hakujenHallintaPage.page.getByTestId(`asha-tunnus-1`)).toHaveValue('pasha-2')
    await expect(hakujenHallintaPage.page.getByTestId(`asha-tunnus-1`)).toBeDisabled()
    await expect(hakujenHallintaPage.page.getByTestId(`lisatiedot-1`)).toHaveValue('lisätiedot 2')
    await expect(hakujenHallintaPage.page.getByTestId(`lisatiedot-1`)).toBeDisabled()
  })
})
