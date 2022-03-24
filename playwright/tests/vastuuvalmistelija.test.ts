import { test, expect } from '@playwright/test'

import { defaultValues } from '../fixtures/defaultValues'
import { HakujenHallintaPage } from '../pages/hakujenHallintaPage'

defaultValues('Vastuuvalmistelija role', async ({ page }) => {
  const hakujenHallinta = new HakujenHallintaPage(page)
  await hakujenHallinta.copyEsimerkkihaku()

  await test.step('is set to current user when copying a haku', async () => {
    await expect(hakujenHallinta.page.locator('[data-test-id="vastuuvalmistelija-name"]')).toHaveValue('_ valtionavustus')
    await expect(hakujenHallinta.page.locator('[data-test-id="vastuuvalmistelija-email"]')).toHaveValue('santeri.horttanainen@reaktor.com')
  })

  await test.step('can be set for a new user', async () => {
    await hakujenHallinta.setVastuuvalmistelija('Karslted')
    await hakujenHallinta.page.reload()
    await expect(hakujenHallinta.page.locator('[data-test-id="vastuuvalmistelija-name"]')).toHaveValue('Tomi Karslted')
    await expect(hakujenHallinta.page.locator('[data-test-id="vastuuvalmistelija-email"]')).toHaveValue('')
  })

  await test.step('can not be set if the new user is a valmistelija already', async () => {
    await hakujenHallinta.addValmistelija('Henry')
    await hakujenHallinta.searchUsersForVastuuvalmistelija('Henry')
    await expect(hakujenHallinta.page.locator('#vastuuvalmistelija li[title="Henry Heikkinen (VA-käyttäjä, oid 1.2.246.562.24.51126009730) (Käyttäjä on jo lisätty avustushakuun)"]')).toHaveAttribute('class', 'disabled')
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
    await hakujenHallinta.searchUsersForRoles('Karslted')
    await expect(hakujenHallinta.page.locator('li[title="Tomi Karslted (VA-käyttäjä, oid 1.2.246.562.24.67715408891) (Käyttäjä on jo lisätty avustushakuun)"]')).toHaveAttribute('class', 'disabled')
    await hakujenHallinta.clearUserSearchForRoles()
  })
})
