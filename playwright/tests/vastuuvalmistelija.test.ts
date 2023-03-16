import { test, expect } from '@playwright/test'

import { defaultValues } from '../fixtures/defaultValues'
import { HakujenHallintaPage } from '../pages/hakujenHallintaPage'
import { HaunTiedotPage } from '../pages/hakujen-hallinta/HaunTiedotPage'

defaultValues('Vastuuvalmistelija role', async ({ page, userCache }) => {
  expect(userCache).toBeDefined()

  const hakujenHallinta = new HakujenHallintaPage(page)
  await hakujenHallinta.copyEsimerkkihaku()
  const haunTiedot = HaunTiedotPage(page)
  const { hakuRole } = haunTiedot.locators
  const vastuuvalmistelija = '_ valtionavustus'
  await test.step('is set to current user when copying a haku', async () => {
    await expect(hakuRole.vastuuvalmistelija.name).toHaveValue(vastuuvalmistelija)
    await expect(hakuRole.vastuuvalmistelija.email).toHaveValue('santeri.horttanainen@reaktor.com')
  })

  const vaRoleRow = hakuRole.roleRow(vastuuvalmistelija)
  await test.step('can not be removed', async () => {
    await expect(vaRoleRow.removeButton).toBeDisabled()
  })

  await test.step('can not change role', async () => {
    await expect(vaRoleRow.select).toBeDisabled()
  })

  await test.step('can be set for a new user', async () => {
    await haunTiedot.addVastuuvalmistelija('Viivi Virkailija')
    await page.reload()
    await expect(hakuRole.vastuuvalmistelija.name).toHaveValue('Viivi Virkailija')
    await expect(hakuRole.vastuuvalmistelija.email).toHaveValue('viivi.virkailja@exmaple.com')
  })

  await test.step(
    'the previous vastuuvalmistelija is automatically set as regular valmistelija to avoid losing edit rights to haku',
    async () => {
      await expect(vaRoleRow.select).toHaveValue('presenting_officer')
      await expect(vaRoleRow.nameInput).toHaveValue('_ valtionavustus')
      await expect(vaRoleRow.emailInput).toHaveValue('santeri.horttanainen@reaktor.com')
    }
  )

  await test.step('name and email can be changed', async () => {
    await hakuRole.vastuuvalmistelija.name.fill('vastuu')
    await hakuRole.vastuuvalmistelija.email.fill('vastuu@valmistelija.fi')
    await haunTiedot.common.waitForSave()
    await page.reload()
    await expect(hakuRole.vastuuvalmistelija.name).toHaveValue('vastuu')
    await expect(hakuRole.vastuuvalmistelija.email).toHaveValue('vastuu@valmistelija.fi')
  })

  await test.step('can not be set as a valmistelija', async () => {
    await hakuRole.searchInput.fill('Viivi')
    await expect(
      page.locator('#roles-list li[data-test-id="1.2.246.562.24.99000000002"]')
    ).toHaveAttribute('class', 'disabled')
    await hakuRole.clearSearch.click()
  })
})
