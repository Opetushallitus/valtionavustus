import { expect } from '@playwright/test'

import { switchUserIdentityTo, countElements } from '../../utils/util'

import { selvitysTest as test } from '../../fixtures/selvitysTest'
import { LoppuselvitysPage } from '../../pages/hakujen-hallinta/LoppuselvitysPage'

test('shows asiatarkastus to pääkäyttäjä who is not valmistelija', async ({
  page,
  avustushakuID,
  loppuselvitysSubmitted: { loppuselvitysFormFilled },
  acceptedHakemus: { hakemusID },
}) => {
  expect(loppuselvitysFormFilled)
  const loppuselvitysPage = LoppuselvitysPage(page)
  await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID)
  await switchUserIdentityTo(page, 'paivipaakayttaja')
  await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID)
  expect(await countElements(page, 'button[name=submit-verification]')).toEqual(1)
})
