import { muutoshakemusTest as test } from '../../fixtures/muutoshakemusTest'
import { expect } from '@playwright/test'
import { HakijaPaatosPage } from '../../pages/HakijaPaatosPage'

test.describe('päätöksen selvitysvelvollisuus-osio', () => {
  test('ei näy jos toimituspäivämääriä tai selvitysvelvollisuus-tekstikenttää ei ole täytetty', async ({
    acceptedHakemus,
    page,
  }) => {
    const hakijaPaatosPage = HakijaPaatosPage(page)
    await hakijaPaatosPage.navigate(acceptedHakemus.hakemusID)

    await hakijaPaatosPage.paatosHeaderTitle.waitFor()
    await expect(page.getByRole('heading', { name: 'Selvitysvelvollisuus' })).not.toBeVisible()
  })
})
