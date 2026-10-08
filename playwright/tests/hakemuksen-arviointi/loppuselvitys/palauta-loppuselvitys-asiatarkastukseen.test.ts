import { expect } from '@playwright/test'

import { selvitysTest } from '../../../fixtures/selvitysTest'
import { LoppuselvitysPage } from '../../../pages/virkailija/hakujen-hallinta/LoppuselvitysPage'
import { VIRKAILIJA_URL } from '../../../utils/constants'
import { switchUserIdentityTo } from '../../../utils/util'

const test = selvitysTest.extend({
  enableOtantatarkastus: true,
})

test('pääkäyttäjä can return asiatarkastettu loppuselvitys to asiatarkastus', async ({
  page,
  request,
  avustushakuID,
  acceptedHakemus: { hakemusID },
  loppuselvitysSubmitted,
}) => {
  expect(loppuselvitysSubmitted).toBeDefined()
  const setOtantapolku = await request.post(
    `${VIRKAILIJA_URL}/api/test/set-loppuselvitys-otantapolku`,
    { data: { 'hakemus-id': hakemusID, otantapolku: 'otannan-ulkopuolella' } }
  )
  expect(setOtantapolku.ok()).toBeTruthy()

  const loppuselvitysPage = LoppuselvitysPage(page)
  const {
    asiatarkastus,
    otantatarkastus,
    taloustarkastus,
    palautaAsiatarkastukseen,
    palautaDialog,
    palautaDialogCancel,
    palautaDialogConfirm,
    palautaDialogSyy,
    palautukset,
    palautusAsiatarkastettu,
    palautusChecklist,
    palautusHistoryRows,
  } = loppuselvitysPage.locators
  const syy = 'Tarkistuslista täytettiin väärin'
  const palautaUrl = `${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/hakemus/${hakemusID}/loppuselvitys/palauta-asiatarkastukseen`

  await test.step('asiatarkasta loppuselvitys with riskiperusteinen checklist', async () => {
    await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID)
    const kyllaLabels = otantatarkastus.checklist.locator('label', { hasText: 'Kyllä' })
    await kyllaLabels.nth(0).click()
    await kyllaLabels.nth(1).click()
    await kyllaLabels.nth(2).click()
    await otantatarkastus.checklist.locator('label', { hasText: 'Ei' }).nth(3).click()
    await expect(otantatarkastus.otannanUlkopuolellaRiskiBanner).toBeVisible()
    await asiatarkastus.acceptMessage.fill('Riskiperusteinen huomio')
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().endsWith('/loppuselvitys/verify-information') && response.status() === 200
      ),
      asiatarkastus.confirmAcceptance.click(),
    ])
  })

  await test.step('non-pääkäyttäjä can not return loppuselvitys', async () => {
    await switchUserIdentityTo(page, 'viivivirkailija')
    await expect(page.getByText('Viivi Virkailija')).toBeVisible()
    await expect(taloustarkastus.accept).toBeVisible()
    await expect(palautaAsiatarkastukseen).toBeHidden()
    const response = await page.request.post(palautaUrl, { data: { syy } })
    expect(response.status()).toBe(403)
    await switchUserIdentityTo(page, 'valtionavustus')
  })

  await test.step('pääkäyttäjä can not return loppuselvitys without syy', async () => {
    const response = await page.request.post(palautaUrl, { data: { syy: '   ' } })
    expect(response.status()).toBe(400)
  })

  await test.step('cancelling the dialog keeps loppuselvitys asiatarkastettu', async () => {
    await expect(taloustarkastus.accept).toBeEnabled()
    await palautaAsiatarkastukseen.click()
    await expect(palautaDialog).toBeVisible()
    await palautaDialogSyy.fill('peruttava syy')
    await palautaDialogCancel.click()
    await expect(palautaDialog).toBeHidden()
    await expect(taloustarkastus.accept).toBeEnabled()
    await expect(palautaAsiatarkastukseen).toBeVisible()
  })

  await test.step('confirming without syy keeps the dialog open', async () => {
    const palautaRequests: string[] = []
    page.on('request', (request) => {
      if (request.url().endsWith('/loppuselvitys/palauta-asiatarkastukseen')) {
        palautaRequests.push(request.url())
      }
    })
    await palautaAsiatarkastukseen.click()
    await expect(palautaDialogSyy).toHaveValue('')
    await palautaDialogConfirm.click()
    await expect(palautaDialog).toBeVisible()
    expect(
      await palautaDialogSyy.evaluate((el: HTMLTextAreaElement) => el.validity.valueMissing)
    ).toBe(true)
    expect(palautaRequests).toHaveLength(0)
  })

  await palautaDialogSyy.fill(syy)
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith('/loppuselvitys/palauta-asiatarkastukseen') &&
        response.status() === 200
    ),
    palautaDialogConfirm.click(),
  ])

  const liveRadios = otantatarkastus.checklist.locator('input[type="radio"]')
  // button is hidden again while loppuselvitys is in asiatarkastus
  // otanta mode renders comment and accept button only after the checklist is filled and
  // hides taloustarkastus until asiatarkastettu, so an empty enabled checklist shows the
  // loppuselvitys is back in asiatarkastus
  const expectReturnedToAsiatarkastus = async () => {
    await expect(taloustarkastus.accept).toBeHidden()
    await expect(palautaAsiatarkastukseen).toBeHidden()
    await expect(palautukset.getByText('Palautettu asiatarkastukseen')).toHaveCount(1)
    await expect(palautukset.getByText(`Syy: ${syy}`)).toBeVisible()
    await expect(liveRadios).toHaveCount(8)
    for (const radio of await liveRadios.all()) {
      await expect(radio).not.toBeChecked()
      await expect(radio).toBeEnabled()
    }
  }
  await expectReturnedToAsiatarkastus()

  await test.step('state persists after reload', async () => {
    await page.reload()
    await expectReturnedToAsiatarkastus()
  })

  await test.step('history shows asiatarkastettu with its checklist followed by palautettu', async () => {
    await expect(palautusHistoryRows).toHaveCount(2)
    await expect(palautusHistoryRows.nth(0)).toContainText('Asiatarkastettu')
    await expect(palautusHistoryRows.nth(0)).toContainText('_ valtionavustus')
    await expect(palautusHistoryRows.nth(0)).toContainText(/\d{2}\.\d{2}\.\d{4}/)
    await expect(palautusHistoryRows.nth(1)).toContainText('Palautettu asiatarkastukseen')
    await expect(palautukset.getByText('Riskiperusteinen huomio')).toBeHidden()
    await expect(palautusChecklist).toBeHidden()

    await palautusAsiatarkastettu.click()
    await expect(palautukset.getByText('Riskiperusteinen huomio')).toBeVisible()
    await expect(palautusChecklist).toBeVisible()
    const kyllaRadios = palautusChecklist.locator('input[value="true"]')
    const eiRadios = palautusChecklist.locator('input[value="false"]')
    for (const [index, expected] of [true, true, true, false].entries()) {
      await expect(kyllaRadios.nth(index)).toBeChecked({ checked: expected })
      await expect(eiRadios.nth(index)).toBeChecked({ checked: !expected })
      await expect(kyllaRadios.nth(index)).toBeDisabled()
    }
  })

  await test.step('writes tapahtumaloki entry and palautus snapshot', async () => {
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
    const [palautus] = loppuselvitysPalautukset
    expect(palautus.information_verified_by).toBe('_ valtionavustus')
    expect(new Date(palautus.information_verified_at).getTime()).not.toBeNaN()
    expect(palautus.syy).toBe(syy)
    expect(palautus['asiatarkastus-checklist']).toEqual({
      'avustus-kaytetty-paatoksen-mukaisesti': true,
      'omarahoitus-kaytetty': true,
      'taloustiedot-kirjattu': true,
      'avustus-alle-100k': false,
    })
    expect(palautus.riskiperusteinen).toBe(true)
  })
})
