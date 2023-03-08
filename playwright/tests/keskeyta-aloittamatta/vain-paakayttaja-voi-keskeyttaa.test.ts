import { expect } from '@playwright/test'
import { expectToBeDefined, switchUserIdentityTo } from '../../utils/util'
import { muutoshakemusTest as test } from '../../fixtures/muutoshakemusTest'
import { HakemustenArviointiPage } from '../../pages/hakemustenArviointiPage'

test.setTimeout(180000)

test('Vain pääkäyttäjä voi keskeyttää hankkeen', async ({
  page,
  answers,
  avustushakuID,
  acceptedHakemus,
}) => {
  expectToBeDefined(acceptedHakemus)
  const hakemustenArviointiPage = new HakemustenArviointiPage(page)
  await hakemustenArviointiPage.navigate(avustushakuID)
  await hakemustenArviointiPage.selectHakemusFromList(answers.projectName)

  await hakemustenArviointiPage.tabs().seuranta.click()

  await switchUserIdentityTo(page, 'viivivirkailija')
  await hakemustenArviointiPage.tabs().seuranta.click()

  const keskeytaAloittamatta = page.locator('#set-keskeyta-aloittamatta-true')
  await expect(keskeytaAloittamatta).toBeDisabled()

  await switchUserIdentityTo(page, 'paivipaakayttaja')
  await hakemustenArviointiPage.tabs().seuranta.click()

  const keskeytaAloittamatta2 = page.locator('#set-keskeyta-aloittamatta-true')
  await expect(keskeytaAloittamatta2).not.toBeDisabled()
})
