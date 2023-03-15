import { expect } from '@playwright/test'

import moment from 'moment'

import { selvitysTest as test } from '../../fixtures/selvitysTest'
import { LoppuselvitysPage } from '../../pages/hakujen-hallinta/LoppuselvitysPage'

test('information verification is shown', async ({
  page,
  avustushakuID,
  acceptedHakemus: { hakemusID },
  asiatarkastus: { asiatarkastettu },
}) => {
  const textareaSelector = 'textarea[name="information-verification"]'
  expect(asiatarkastettu)
  const loppuselvitysPage = LoppuselvitysPage(page)
  await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID)
  expect(await page.textContent(textareaSelector)).toEqual('Hyvältä näyttääpi')
  expect(await page.isDisabled(textareaSelector)).toEqual(true)
  expect(await page.innerText('[data-test-id=verifier]')).toEqual('_ valtionavustus')
  expect(
    moment(
      await page.innerText('[data-test-id=verified-at]'),
      'D.M.YYYY [klo] H.mm'
    ).isSameOrBefore()
  ).toBeTruthy()
})
