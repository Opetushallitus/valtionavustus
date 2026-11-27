import { expect } from '@playwright/test'
import { unpublishedAvustushakuTest as test } from '../../fixtures/muutoshakemusTest'
import { CommonHakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/CommonHakujenHallintaPage'
import { VIRKAILIJA_URL } from '../../utils/constants'

test('haku, jonka lomakkeella on Painopistealueet-kenttä, vaatii painopistealueen ennen julkaisua', async ({
  page,
  avustushakuID,
}) => {
  const hallinta = CommonHakujenHallintaPage(page)
  const hakulomake = await hallinta.switchToHakulomakeTab()
  await hakulomake.addFields({
    type: 'vaFocusAreas',
    fieldId: 'focus-areas',
    fieldLabel: 'Painopistealueet',
  })

  const haunTiedot = await hallinta.switchToHaunTiedotTab()
  const { painopistealueet, status, statusInput } = haunTiedot.locators

  await test.step('Julkaisuyritys jättää haun luonnokseksi, kun painopistealueita ei ole', async () => {
    await expect(painopistealueet.table).toBeVisible()
    await expect(painopistealueet.inputs).toHaveCount(0)
    await expect(statusInput('draft')).toBeChecked()
    await status.published.click()
    await expect(statusInput('draft')).toBeChecked()
  })

  await test.step('Haku voidaan julkaista, kun painopistealue on lisätty', async () => {
    const hakuUrl = `${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}`
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url() === hakuUrl && response.request().method() === 'POST' && response.ok()
      ),
      painopistealueet.addButton.click(),
    ])
    await hallinta.waitForSave()

    await painopistealueet.input(0, 'fi').fill('Oppimisen tuki')
    await painopistealueet.input(0, 'sv').fill('Stöd för lärande')
    await hallinta.waitForSave()

    await haunTiedot.publishAvustushaku()
    await page.reload()
    await expect(statusInput('published')).toBeChecked()
  })
})
