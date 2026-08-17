import { expect } from '@playwright/test'
import { muutoshakemusTest as test } from '../../fixtures/muutoshakemusTest'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { VIRKAILIJA_URL } from '../../utils/constants'

test('päätöseditori lukitaan kun haku on ratkaistu ja avataan kun haku palautetaan julkaistuksi', async ({
  page,
  closedAvustushaku,
}) => {
  const avustushakuID = closedAvustushaku.id
  const hakujenHallintaPage = new HakujenHallintaPage(page)
  const haunTiedotPage = await hakujenHallintaPage.navigate(avustushakuID)

  const paatosPage = await haunTiedotPage.common.switchToPaatosTab()
  await paatosPage.common.waitForAvustushakuReady()
  await expect(paatosPage.locators.paatosLukittuIlmoitus).toBeHidden()
  await expect(paatosPage.locators.taustaa).toBeEnabled()

  await test.step('ratkaistulla haulla kentät on lukittu', async () => {
    const haunTiedot = await paatosPage.common.switchToHaunTiedotTab()
    await haunTiedot.resolveAvustushaku()

    await paatosPage.navigateTo(avustushakuID)
    await paatosPage.common.waitForAvustushakuReady()

    await expect(paatosPage.locators.paatosLukittuIlmoitus).toBeVisible()
    await expect(paatosPage.locators.taustaa).toBeDisabled()
    await expect(paatosPage.locators.kayttotarkoitus).toBeDisabled()
    await expect(paatosPage.locators.maksuaika).toBeDisabled()
    await expect(paatosPage.locators.oikaisuvaatimus3aCheckbox).toBeDisabled()
    await expect(paatosPage.locators.pakoteOhjeInput).toBeDisabled()
    await expect(paatosPage.locators.decisionDate).toBeDisabled()
    await expect(paatosPage.locators.hankkeenAlkamisPaiva).toBeDisabled()
    await expect(paatosPage.locators.hankkeenPaattymisPaiva).toBeDisabled()
    await expect(paatosPage.locators.valiselvitysDate).toBeDisabled()
    await expect(paatosPage.locators.loppuselvitysDate).toBeDisabled()
  })

  await test.step('päätösten lähettäminen on yhä mahdollista', async () => {
    await expect(page.getByText('Päätösten lähettäminen sähköpostilla')).toBeVisible()
  })

  await test.step('julkaistuksi palautetulla haulla kentät ovat taas muokattavissa', async () => {
    const haunTiedot = await paatosPage.common.switchToHaunTiedotTab()
    await haunTiedot.publishAvustushaku()

    await paatosPage.navigateTo(avustushakuID)
    await paatosPage.common.waitForAvustushakuReady()

    await expect(paatosPage.locators.paatosLukittuIlmoitus).toBeHidden()
    await expect(paatosPage.locators.taustaa).toBeEnabled()

    await paatosPage.locators.taustaa.fill('Taustaa muokattu julkaistussa tilassa')
    await paatosPage.waitForSave()

    await paatosPage.navigateTo(avustushakuID)
    await paatosPage.common.waitForAvustushakuReady()
    await expect(paatosPage.locators.taustaa).toHaveValue('Taustaa muokattu julkaistussa tilassa')
  })
})

test('palvelin estää päätöstietojen muuttamisen kun haku on ratkaistu', async ({
  page,
  closedAvustushaku,
}) => {
  const avustushakuID = closedAvustushaku.id
  const hakujenHallintaPage = new HakujenHallintaPage(page)
  const haunTiedotPage = await hakujenHallintaPage.navigate(avustushakuID)
  await haunTiedotPage.resolveAvustushaku()

  const hakuDataResponse = await page.request.get(
    `${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}`,
    { failOnStatusCode: true }
  )
  const avustushaku = (await hakuDataResponse.json()).avustushaku

  const postAvustushaku = (body: unknown) =>
    page.request.post(`${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}`, { data: body })

  await test.step('päätöstekstin muuttaminen hylätään', async () => {
    const response = await postAvustushaku({
      ...avustushaku,
      decision: { ...avustushaku.decision, taustaa: { fi: 'ohi käyttöliittymän', sv: '' } },
    })
    expect(response.status()).toBe(400)
  })

  await test.step('selvityksen aikarajan muuttaminen hylätään', async () => {
    const response = await postAvustushaku({
      ...avustushaku,
      loppuselvitysdate: '2035-12-31',
    })
    expect(response.status()).toBe(400)
  })

  await test.step('muuttumattoman päätöksen tallentaminen onnistuu', async () => {
    const response = await postAvustushaku(avustushaku)
    expect(response.status()).toBe(200)
  })

  await test.step('päätöstiedot eivät ole muuttuneet', async () => {
    const response = await page.request.get(`${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}`, {
      failOnStatusCode: true,
    })
    const currentAvustushaku = (await response.json()).avustushaku
    expect(currentAvustushaku.decision.taustaa).toEqual(avustushaku.decision.taustaa)
    expect(currentAvustushaku.loppuselvitysdate).toEqual(avustushaku.loppuselvitysdate)
  })
})
