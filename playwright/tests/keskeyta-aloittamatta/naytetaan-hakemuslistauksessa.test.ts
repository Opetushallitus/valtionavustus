import { expect } from '@playwright/test'
import { muutoshakemusTest as test } from '../../fixtures/muutoshakemusTest'
import { HakemustenArviointiPage } from '../../pages/hakemustenArviointiPage'

test.setTimeout(180000)

test('Keskeyttäminen aloittamatta näkyy hakemuslistauksessa', async ({
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

  await page.click('#close-hakemus-button')

  const hakemusRow = await page.locator(`[data-test-id="hakemus-${acceptedHakemus.hakemusID}"]`)

  const statusText = await hakemusRow.locator('.hakemus-status-cell').innerText()

  expect(statusText).toBe('Kesk. aloitt.')
})
