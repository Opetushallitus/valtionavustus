import { expect } from '@playwright/test'

import { switchUserIdentityTo } from '../../../utils/util'

import { selvitysTest as test } from '../../../fixtures/selvitysTest'
import { LoppuselvitysPage } from '../../../pages/hakujen-hallinta/LoppuselvitysPage'

test('shows asiatarkastus to pääkäyttäjä who is not valmistelija', async ({
  page,
  avustushakuID,
  loppuselvitysSubmitted: { loppuselvitysFormFilled },
  acceptedHakemus: { hakemusID },
}) => {
  expect(loppuselvitysFormFilled)
  const loppuselvitysPage = LoppuselvitysPage(page)
  await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID)
  const va = page.getByText('_ valtionavustus')
  const paiviPaakayttaja = page.getByText('Päivi Pääkäyttäjä')
  await expect(va).toBeVisible()
  await expect(paiviPaakayttaja).toBeHidden()
  await expect(loppuselvitysPage.locators.asiatarkastus.accept).toBeVisible()
  await switchUserIdentityTo(page, 'paivipaakayttaja')
  await expect(va).toBeHidden()
  await expect(paiviPaakayttaja).toBeVisible()
  await expect(loppuselvitysPage.locators.asiatarkastus.accept).toBeVisible()
})
