import { expect } from '@playwright/test'

import { navigate } from '../../../utils/navigate'

import { HakijaSelvitysPage } from '../../../pages/hakijaSelvitysPage'
import { selvitysTest as test } from '../../../fixtures/selvitysTest'

test('hakija can not edit loppuselvitys after information has been verified', async ({
  page,
  loppuselvitysSubmitted: { loppuselvitysFormUrl },
  asiatarkastus: { asiatarkastettu },
}) => {
  expect(asiatarkastettu)
  await navigate(page, loppuselvitysFormUrl)
  await expect(page.locator('span[id="textArea-0"]')).toHaveText('Yhteenveto')
  await expect(page.locator('textarea[id="textArea-0"]')).toBeHidden()

  const hakijaSelvitysPage = HakijaSelvitysPage(page)
  await expect(hakijaSelvitysPage.loppuselvitysWarning).toBeVisible()
  await expect(hakijaSelvitysPage.submitButton).toBeHidden()
})
