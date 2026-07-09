import { expect } from '@playwright/test'

import { selvitysTest } from '../../fixtures/selvitysTest'
import { ValiselvitysPage } from '../../pages/virkailija/hakujen-hallinta/ValiselvitysPage'
import { LoppuselvitysPage } from '../../pages/virkailija/hakujen-hallinta/LoppuselvitysPage'
import valiselvitysWithEmail from './selvitysForms/valiselvitys-with-email.json'
import loppuselvitysWithEmail from './selvitysForms/loppuselvitys-with-email.json'

const test = selvitysTest.extend({
  valiselvitysForm: JSON.stringify(valiselvitysWithEmail),
  loppuselvitysForm: JSON.stringify(loppuselvitysWithEmail),
  valiselvitysYhteyshenkilo: { email: 'yhteyshenkilo@example.com', name: 'Ylermi Yhteyshenkilö' },
  loppuselvitysYhteyshenkilo: { email: 'yhteyshenkilo@example.com', name: 'Ylermi Yhteyshenkilö' },
})

test('selvitysten sähköpostilomakkeet näyttävät varoituksen kun organisaation sähköpostia ei saada', async ({
  page,
  avustushakuID,
  acceptedHakemus: { hakemusID },
  valiAndLoppuselvitysSubmitted,
}) => {
  expect(valiAndLoppuselvitysSubmitted).toBeDefined()
  await page.route('**/organisation-email', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ email: null }),
    })
  )

  await test.step('väliselvityksen hyväksymisviesti', async () => {
    const valiselvitysPage = ValiselvitysPage(page)
    await valiselvitysPage.navigateToValiselvitysTab(avustushakuID, hakemusID)
    await expect(page.getByTestId('selvitys-email-org-email-warning')).toBeVisible()
    await expect(page.locator('#submit-selvitys')).toBeEnabled()
    await expect(page.locator('input.selvitys-email-header__value-input').first()).toHaveValue(
      'hakija-1424884@oph.fi'
    )
  })

  await test.step('loppuselvityksen muistutusviesti ja asiatarkastuksen täydennyspyyntö', async () => {
    const loppuselvitysPage = LoppuselvitysPage(page)
    await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID)

    await loppuselvitysPage.locators.muistutusviesti.open.click()
    await expect(page.getByTestId('muistutusviesti-recipients-warning')).toBeVisible()
    await expect(page.getByTestId('muistutusviesti-submit')).toBeEnabled()

    await loppuselvitysPage.locators.asiatarkastus.taydennyspyynto.click()
    await expect(
      page.getByTestId('loppuselvitys-taydennyspyynto-asiatarkastus-recipients-warning')
    ).toBeVisible()
  })
})
