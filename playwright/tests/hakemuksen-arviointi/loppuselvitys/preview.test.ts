import { expect } from '@playwright/test'
import { selvitysTest as test } from '../../../fixtures/selvitysTest'
import { HakujenHallintaPage } from '../../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'

test('loppuselvityksen esikatselu näyttää miltä loppuselvitys näyttää hakijalle', async ({
  avustushakuID,
  page,
}) => {
  const hakujenHallintaPage = new HakujenHallintaPage(page)
  const loppuselvitysPage = await hakujenHallintaPage.navigateToLoppuselvitys(avustushakuID)
  const previewPage = await loppuselvitysPage.goToPreview()

  expect(previewPage.url()).toContain('esikatselu')

  await previewPage.isVisible('input#organization')
})
