import { expect, Page } from '@playwright/test'

export const saveStatusTestId = 'save-status'

export async function waitForSave(page: Page) {
  await expect(
    page.getByTestId(saveStatusTestId).locator('text="Kaikki tiedot tallennettu"')
  ).toBeVisible({ timeout: 10000 })
}
