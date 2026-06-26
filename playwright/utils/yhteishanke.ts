import { expect, Page } from '@playwright/test'

export const otherOrganization = (page: Page, index: number) => {
  const indexStartsFromOne = index + 1
  const baseLocator = page.locator(`[id="other-organizations-${indexStartsFromOne}"]`)
  return {
    name: baseLocator.locator(
      `[id="other-organizations.other-organizations-${indexStartsFromOne}.name"]`
    ),
    contactPerson: baseLocator.locator(
      `[id="other-organizations.other-organizations-${indexStartsFromOne}.contactperson"]`
    ),
    email: baseLocator.locator(
      `[id="other-organizations.other-organizations-${indexStartsFromOne}.email"]`
    ),
    remove: baseLocator.getByTitle('poista'),
  }
}

export async function submitMuutoshakemusAndExpectSuccess(page: Page) {
  const submitMuutoshakemusResponse = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' && /\/api\/muutoshakemus\//.test(response.url())
  )
  await page.locator('#send-muutospyynto-button').click()
  const response = await submitMuutoshakemusResponse
  const responseText = await response.text()
  expect(
    response.ok(),
    `Muutoshakemus submit failed with ${response.status()}: ${responseText}`
  ).toBeTruthy()
}
