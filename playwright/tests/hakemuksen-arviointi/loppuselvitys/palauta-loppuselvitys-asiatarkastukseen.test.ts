import { expect } from '@playwright/test'

import { selvitysTest as test } from '../../../fixtures/selvitysTest'
import { LoppuselvitysPage } from '../../../pages/virkailija/hakujen-hallinta/LoppuselvitysPage'
import { VIRKAILIJA_URL } from '../../../utils/constants'
import { switchUserIdentityTo } from '../../../utils/util'

test('pääkäyttäjä can return asiatarkastettu loppuselvitys to asiatarkastus', async ({
  page,
  avustushakuID,
  acceptedHakemus: { hakemusID },
  asiatarkastus: { asiatarkastettu },
}) => {
  expect(asiatarkastettu)
  const loppuselvitysPage = LoppuselvitysPage(page)
  const {
    asiatarkastus,
    taloustarkastus,
    palautaAsiatarkastukseen,
    palautaDialog,
    palautaDialogCancel,
    palautaDialogConfirm,
    palautukset,
  } = loppuselvitysPage.locators
  const palautaUrl = `${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/hakemus/${hakemusID}/loppuselvitys/palauta-asiatarkastukseen`

  await test.step('non-pääkäyttäjä can not return loppuselvitys', async () => {
    await switchUserIdentityTo(page, 'viivivirkailija')
    await expect(page.getByText('Viivi Virkailija')).toBeVisible()
    await expect(taloustarkastus.accept).toBeVisible()
    await expect(palautaAsiatarkastukseen).toBeHidden()
    const response = await page.request.post(palautaUrl, { data: {} })
    expect(response.status()).toBe(403)
    await switchUserIdentityTo(page, 'valtionavustus')
  })

  await expect(taloustarkastus.accept).toBeEnabled()
  await palautaAsiatarkastukseen.click()
  await expect(palautaDialog).toBeVisible()
  await palautaDialogCancel.click()
  await expect(palautaDialog).toBeHidden()
  await expect(taloustarkastus.accept).toBeEnabled()
  await expect(palautaAsiatarkastukseen).toBeVisible()

  const palautaResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith('/loppuselvitys/palauta-asiatarkastukseen') &&
      response.status() === 200
  )
  await palautaAsiatarkastukseen.click()
  await Promise.all([palautaResponse, palautaDialogConfirm.click()])

  // button is hidden again while loppuselvitys is in asiatarkastus
  const expectReturnedToAsiatarkastus = async () => {
    await expect(asiatarkastus.confirmAcceptance).toBeVisible()
    await expect(asiatarkastus.acceptMessage).toBeEditable()
    await expect(asiatarkastus.acceptMessage).toHaveValue('')
    await expect(taloustarkastus.accept).toBeDisabled()
    await expect(palautaAsiatarkastukseen).toBeHidden()
    await expect(palautukset.getByText('Palautettu asiatarkastukseen')).toHaveCount(1)
  }
  await expectReturnedToAsiatarkastus()

  await test.step('state persists after reload', async () => {
    await page.reload()
    await expectReturnedToAsiatarkastus()
  })

  await test.step('history shows asiatarkastettu followed by palautettu', async () => {
    const { palautusHistoryRows, palautusAsiatarkastettu } = loppuselvitysPage.locators
    await expect(palautusHistoryRows).toHaveCount(2)
    await expect(palautusHistoryRows.nth(0)).toContainText('Asiatarkastettu')
    await expect(palautusHistoryRows.nth(0)).toContainText('_ valtionavustus')
    await expect(palautusHistoryRows.nth(0)).toContainText(/\d{2}\.\d{2}\.\d{4}/)
    await expect(palautusHistoryRows.nth(1)).toContainText('Palautettu asiatarkastukseen')
    await expect(palautusHistoryRows.nth(1)).not.toHaveAttribute('role', 'button')
    await expect(palautukset.getByText('Ei kommentoitavaa')).toBeHidden()
    await palautusAsiatarkastettu.click()
    await expect(palautukset.getByText('Ei kommentoitavaa')).toBeVisible()
  })

  await test.step('writes tapahtumaloki entry', async () => {
    const response = await page.request.get(
      `${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/hakemus/${hakemusID}/tapahtumaloki/loppuselvitys-palautettu-asiatarkastukseen`,
      { failOnStatusCode: true }
    )
    const entries = await response.json()
    expect(entries).toHaveLength(1)
    expect(entries[0].success).toBe(true)

    const { loppuselvitysPalautukset } = await (
      await page.request.get(
        `${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/hakemus/${hakemusID}/selvitys`,
        { failOnStatusCode: true }
      )
    ).json()
    expect(loppuselvitysPalautukset).toHaveLength(1)
    expect(loppuselvitysPalautukset[0].information_verified_by).toBe('_ valtionavustus')
    expect(new Date(loppuselvitysPalautukset[0].information_verified_at).getTime()).not.toBeNaN()
  })
})
