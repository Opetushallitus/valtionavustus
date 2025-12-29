import { expect } from '@playwright/test'
import { muutoshakemusTest as test } from '../../fixtures/muutoshakemusTest'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import {
  getLoppuselvitysEmails,
  getValiselvitysEmails,
  waitUntilMinEmails,
} from '../../utils/emails'

test('Älä lähetä selvityspyyntöjä jos hakemus on kekeytetty aloittamatta', async ({
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
  await test.step('Navigate to hakemus', async () => {
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    await hakemustenArviointiPage.navigate(avustushakuID)
    await hakemustenArviointiPage.selectHakemusFromList(projectName)

    await hakemustenArviointiPage.tabs().seuranta.click()

    await page.click('[data-test-id="keskeyta-aloittamatta"]')

    await hakemustenArviointiPage.waitForSave()

    await page.click('#close-hakemus-button')
  })

  const hakujenHallintaPage = new HakujenHallintaPage(page)
  await test.step('no väliselvitys email', async () => {
    await hakujenHallintaPage.navigate(avustushakuID)
    const valiselvitysPage =
      await hakujenHallintaPage.commonHakujenHallinta.switchToValiselvitysTab()
    await valiselvitysPage.sendValiselvitys(0)
    const emails = await waitUntilMinEmails(getValiselvitysEmails, 0, acceptedHakemus.hakemusID)
    expect(emails).toHaveLength(0)
  })
  await test.step('no loppuselvitys email', async () => {
    await hakujenHallintaPage.navigate(avustushakuID)
    const loppuselvitysTab = await hakujenHallintaPage.switchToLoppuselvitysTab()
    await loppuselvitysTab.sendLoppuselvitys(0)
    const emails = await waitUntilMinEmails(getLoppuselvitysEmails, 0, acceptedHakemus.hakemusID)
    expect(emails).toHaveLength(0)
  })
})
