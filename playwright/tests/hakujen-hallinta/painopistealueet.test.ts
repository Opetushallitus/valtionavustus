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
  const { julkaisuvirhe, painopistealueet, statusInput } = haunTiedot.locators

  await test.step('Julkaisun estävä varoitus näkyy, kun painopistealueita ei ole', async () => {
    await expect(painopistealueet.table).toBeVisible()
    await expect(painopistealueet.inputs).toHaveCount(0)
    await expect(statusInput('draft')).toBeChecked()
    await expect(statusInput('published')).toBeDisabled()
    await expect(julkaisuvirhe.warning).toBeVisible()
    await expect(julkaisuvirhe.warning).toContainText(
      'Avustushaun julkaiseminen ei ole mahdollista'
    )
    await julkaisuvirhe.detailsButton.click()
    await expect(julkaisuvirhe.fieldId).toHaveText('focus-areas')
  })

  await test.step('Julkaisu edellyttää painopistealueen nimeä suomeksi ja ruotsiksi', async () => {
    const hakuUrl = `${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}`
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url() === hakuUrl && response.request().method() === 'POST' && response.ok()
      ),
      painopistealueet.addButton.click(),
    ])
    await hallinta.waitForSave()
    await expect(statusInput('published')).toBeDisabled()

    await painopistealueet.input(0, 'fi').fill('Oppimisen tuki')
    await expect(statusInput('published')).toBeDisabled()
    await expect(julkaisuvirhe.warning).toBeVisible()
    await painopistealueet.input(0, 'sv').fill('Stöd för lärande')
    await hallinta.waitForSave()
    await expect(julkaisuvirhe.warning).toBeHidden()

    await haunTiedot.publishAvustushaku()
    await page.reload()
    await expect(statusInput('published')).toBeChecked()
  })
})
