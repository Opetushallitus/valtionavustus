import { expect } from '@playwright/test'
import { muutoshakemusTest as test } from '../../fixtures/muutoshakemusTest'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'

test.setTimeout(180000)

test('Keskeyttaminen aloittamatta laittaa hakemuksen refused tilaan ja epäkeskeyttäminen kumoaa tämän', async ({
  page,
  answers,
  avustushakuID,
  acceptedHakemus,
}) => {
  expect(acceptedHakemus).toBeDefined
  const projectName = answers.projectName
  if (!projectName) {
    throw new Error('projectName must be set in order to select hakemus')
  }
  const hakemustenArviointiPage = new HakemustenArviointiPage(page)
  await hakemustenArviointiPage.navigate(avustushakuID)
  await hakemustenArviointiPage.selectHakemusFromList(projectName)

  await hakemustenArviointiPage.tabs().seuranta.click()

  await page.click('[data-test-id="keskeyta-aloittamatta"]')

  await hakemustenArviointiPage.waitForSave()

  await expect(page.locator('#tab-content.disabled')).toHaveCount(1)

  await page.click('[data-test-id="peru-keskeyta-aloittamatta"]')
  await hakemustenArviointiPage.waitForSave()

  await expect(page.locator('#tab-content.disabled')).toHaveCount(0)
})
