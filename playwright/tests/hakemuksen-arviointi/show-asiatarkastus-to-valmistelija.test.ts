import { expect } from '@playwright/test'

import moment from 'moment'

import { selvitysTest as test } from '../../fixtures/selvitysTest'
import { LoppuselvitysPage } from '../../pages/hakujen-hallinta/LoppuselvitysPage'

test('information verification is shown', async ({
  page,
  acceptedHakemus: { hakemusID },
  asiatarkastus: { asiatarkastettu },
}) => {
  expect(hakemusID).toBeTruthy()
  expect(asiatarkastettu).toBeTruthy()
  const loppuselvitysPage = LoppuselvitysPage(page)
  await expect(loppuselvitysPage.locators.asiatarkastettu).toContainText('_ valtionavustus')
  await expect(loppuselvitysPage.locators.asiatarkastettu).toContainText([
    moment().format('DD.MM.YYYY'),
  ])
})
