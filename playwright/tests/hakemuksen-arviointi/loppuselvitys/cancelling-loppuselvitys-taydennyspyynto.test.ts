import { selvitysTest as test } from '../../../fixtures/selvitysTest'
import { HakemustenArviointiPage } from '../../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { expect } from '@playwright/test'
import { expectToBeDefined } from '../../../utils/util'

test('can cancel taydennyspyynto for loppuselvitys', async ({
  page,
  acceptedHakemus: { hakemusID },
  avustushakuID,
  loppuselvitysSubmitted,
}) => {
  expectToBeDefined(loppuselvitysSubmitted)
  const hakemustenArviointiPage = new HakemustenArviointiPage(page)
  const loppuselvitysPage = await hakemustenArviointiPage.navigateToHakemusArviointiLoppuselvitys(
    avustushakuID,
    hakemusID
  )
  await test.step('can cancel täydennyspyyntö in asiatarkastus', async () => {
    await expect(loppuselvitysPage.locators.asiatarkastus.cancelTaydennyspyynto).not.toBeVisible()
    await expect(loppuselvitysPage.locators.taloustarkastus.cancelTaydennyspyynto).not.toBeVisible()
    await loppuselvitysPage.locators.asiatarkastus.taydennyspyynto.click()
    await loppuselvitysPage.page.getByLabel('Aihe').fill('Täydennyspyyntö')
    await loppuselvitysPage.page.getByLabel('Sisältö').fill('Täydennys asiatarkastus')
    await loppuselvitysPage.page.getByRole('button', { name: 'Lähetä' }).click()
    await expect(loppuselvitysPage.locators.asiatarkastus.cancelTaydennyspyynto).toBeVisible()
    await expect(loppuselvitysPage.locators.taloustarkastus.cancelTaydennyspyynto).not.toBeVisible()
    const previewPage = await loppuselvitysPage.openLoppuselvitysForm()
    await expect(previewPage.getByText('Lähetä täydennys käsiteltäväksi')).toBeVisible()
    await previewPage.close()
    await loppuselvitysPage.getSelvitysFormUrl()
    await loppuselvitysPage.locators.asiatarkastus.cancelTaydennyspyynto.click()
    await expect(loppuselvitysPage.locators.asiatarkastus.taydennyspyynto).toBeVisible()
    const previewPageAgain = await loppuselvitysPage.openLoppuselvitysForm()
    await expect(previewPageAgain.getByText('Loppuselvitys lähetetty')).toBeVisible()
    await previewPageAgain.close()
  })
  await test.step('asiatarkasta loppuselvitys', async () => {
    await loppuselvitysPage.asiatarkastaLoppuselvitys('')
    const previewPage = await loppuselvitysPage.openLoppuselvitysForm()
    await expect(
      previewPage.getByText('Loppuselvityksen jättämisen määräaika on umpeutunut')
    ).toBeVisible()
    await previewPage.close()
  })
  await test.step('can cancel täydennyspyyntö in taloustarkastus', async () => {
    await expect(loppuselvitysPage.locators.asiatarkastus.cancelTaydennyspyynto).not.toBeVisible()
    await expect(loppuselvitysPage.locators.taloustarkastus.cancelTaydennyspyynto).not.toBeVisible()
    await loppuselvitysPage.locators.taloustarkastus.taydennyspyynto.click()
    await loppuselvitysPage.page.getByLabel('Aihe').fill('Täydennyspyyntö')
    await loppuselvitysPage.page.getByLabel('Sisältö').fill('Täydennys asiatarkastus')
    await loppuselvitysPage.page.getByRole('button', { name: 'Lähetä' }).click()
    await expect(loppuselvitysPage.locators.asiatarkastus.cancelTaydennyspyynto).not.toBeVisible()
    await expect(loppuselvitysPage.locators.taloustarkastus.cancelTaydennyspyynto).toBeVisible()
    const previewPage = await loppuselvitysPage.openLoppuselvitysForm()
    await expect(previewPage.getByText('Lähetä täydennys käsiteltäväksi')).toBeVisible()
    await previewPage.close()
    await loppuselvitysPage.locators.taloustarkastus.cancelTaydennyspyynto.click()
    await expect(loppuselvitysPage.locators.taloustarkastus.taydennyspyynto).toBeVisible()
    const previewPageAgain = await loppuselvitysPage.openLoppuselvitysForm()
    await expect(
      previewPageAgain.getByText('Loppuselvityksen jättämisen määräaika on umpeutunut')
    ).toBeVisible()
    await previewPageAgain.close()
  })
})
