import { test, expect } from '@playwright/test'

import { defaultValues } from '../fixtures/defaultValues'
import { HakujenHallintaPage } from '../pages/hakujenHallintaPage'

defaultValues('Vastuuvalmistelija role', async ({ page, userCache }) => {
  expect(userCache).toBeDefined()

  const hakujenHallinta = new HakujenHallintaPage(page)
  await hakujenHallinta.copyEsimerkkihaku()

  await test.step('is set to current user when copying a haku', async () => {
    await expect(hakujenHallinta.page.locator('[data-test-id="vastuuvalmistelija-name"]')).toHaveValue('_ valtionavustus')
    await expect(hakujenHallinta.page.locator('[data-test-id="vastuuvalmistelija-email"]')).toHaveValue('santeri.horttanainen@reaktor.com')
  })

  await test.step('can be set for a new user', async () => {
    await hakujenHallinta.setVastuuvalmistelija('Viivi')
    await hakujenHallinta.page.reload()
    await expect(hakujenHallinta.page.locator('[data-test-id="vastuuvalmistelija-name"]')).toHaveValue('Viivi Virkailija')
    await expect(hakujenHallinta.page.locator('[data-test-id="vastuuvalmistelija-email"]')).toHaveValue('viivi.virkailja@exmaple.com')
  })

  await test.step('can not be set if the new user is a valmistelija already', async () => {
    await hakujenHallinta.addValmistelija('Päivi')
    await hakujenHallinta.searchUsersForVastuuvalmistelija('Päivi')
    await expect(hakujenHallinta.page.locator('#vastuuvalmistelija li[data-test-id="1.2.246.562.24.99000000001"]')).toHaveAttribute('class', 'disabled')
    await hakujenHallinta.clearUserSearchForVastuuvalmistelija()
  })

  await test.step('name and email can be changed', async () => {
    await hakujenHallinta.fillVastuuvalmistelijaName('vastuu')
    await hakujenHallinta.fillVastuuvalmistelijaEmail('vastuu@valmistelija.fi')
    await hakujenHallinta.page.reload()
    await expect(hakujenHallinta.page.locator('[data-test-id="vastuuvalmistelija-name"]')).toHaveValue('vastuu')
    await expect(hakujenHallinta.page.locator('[data-test-id="vastuuvalmistelija-email"]')).toHaveValue('vastuu@valmistelija.fi')
  })

  await test.step('can not be set as a valmistelija', async () => {
    await hakujenHallinta.searchUsersForRoles('Viivi')
    await expect(hakujenHallinta.page.locator('#roles-list li[data-test-id="1.2.246.562.24.99000000002"]')).toHaveAttribute('class', 'disabled')
    await hakujenHallinta.clearUserSearchForRoles()
  })
})
