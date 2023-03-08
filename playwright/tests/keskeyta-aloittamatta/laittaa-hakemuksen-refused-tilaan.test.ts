import { expect } from '@playwright/test'
import { muutoshakemusTest as test } from '../../fixtures/muutoshakemusTest'
import { HakemustenArviointiPage } from '../../pages/hakemustenArviointiPage'

test.setTimeout(180000)

test('Keskeyttaminen aloittamatta laittaa hakemuksen refused tilaan ja epäkeskeyttäminen kumoaa tämän', async ({
  page,
  answers,
  avustushakuID,
  acceptedHakemus,
}) => {
  expect(acceptedHakemus).toBeDefined
  const hakemustenArviointiPage = new HakemustenArviointiPage(page)
  await hakemustenArviointiPage.navigate(avustushakuID)
  await hakemustenArviointiPage.selectHakemusFromList(answers.projectName)

  await hakemustenArviointiPage.tabs().seuranta.click()

  await page.click('[data-test-id="keskeyta-aloittamatta"]')

  await hakemustenArviointiPage.waitForSave()

  await expect(page.locator('#tab-content.disabled')).toHaveCount(1)

  await page.click('[data-test-id="peru-keskeyta-aloittamatta"]')
  await hakemustenArviointiPage.waitForSave()

  await expect(page.locator('#tab-content.disabled')).toHaveCount(0)
})
