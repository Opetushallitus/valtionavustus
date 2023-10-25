import { expect } from '@playwright/test'

import { switchUserIdentityTo } from '../../../utils/util'

import { selvitysTest as test } from '../../../fixtures/selvitysTest'
import { LoppuselvitysPage } from '../../../pages/virkailija/hakujen-hallinta/LoppuselvitysPage'

test('does not show asiatarkastus to a virkailija who is not valmistelija', async ({
  page,
  avustushakuID,
  loppuselvitysSubmitted: { loppuselvitysFormFilled },
  acceptedHakemus: { hakemusID },
}) => {
  expect(loppuselvitysFormFilled)
  const loppuselvitysPage = LoppuselvitysPage(page)
  await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID)
  const formText = page.getByText('Lyhyt yhteenveto hankkeesta')
  await expect(formText).toBeVisible()
  await expect(loppuselvitysPage.locators.asiatarkastus.confirmAcceptance).toBeVisible()
  await switchUserIdentityTo(page, 'viivivirkailija')
  await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID)
  await expect(formText).toBeVisible()
  await expect(loppuselvitysPage.locators.asiatarkastus.confirmAcceptance).toBeHidden()
})
