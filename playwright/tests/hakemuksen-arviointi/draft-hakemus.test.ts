import { test, expect } from '@playwright/test'
import { muutoshakemusTest } from '../../fixtures/muutoshakemusTest'
import { HakemustenArviointiPage } from '../../pages/hakemustenArviointiPage'
import { HakijaAvustusHakuPage } from '../../pages/hakijaAvustusHakuPage'
import { TEST_Y_TUNNUS } from '../../utils/constants'
import { expectToBeDefined } from '../../utils/util'

interface NewHakemusFixtures {
  newHakemus: string
}

const newHakemusTest = muutoshakemusTest.extend<NewHakemusFixtures>({
  newHakemus: async ({ avustushakuID, page }, use, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 15_000)

    let hakemusUrl: string | null = null
    await test.step('Create new hakemus link', async () => {
      const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
      const email = 'teppo.testaaja@example.com'
      await hakijaAvustusHakuPage.navigate(avustushakuID, 'fi')
      hakemusUrl = await hakijaAvustusHakuPage.startApplication(avustushakuID, email)
    })
    expectToBeDefined(hakemusUrl)
    await use(hakemusUrl)
  },
})

newHakemusTest('an unsubmitted (draft) hakemus', async ({ avustushakuID, newHakemus, page }) => {
  const hakemusListPage = new HakemustenArviointiPage(page)
  const hakijaPage = HakijaAvustusHakuPage(page)

  await test.step('is not shown in showAll list when new', async () => {
    await hakemusListPage.navigate(avustushakuID)
    await hakemusListPage.showUnfinished.check()
    expect(await hakemusListPage.hakemusRows.count()).toBe(0)
  })

  await test.step('is shown in showAll list after applicant has edited application for the first time', async () => {
    await page.goto(newHakemus)
    await hakijaPage.fillInBusinessId(TEST_Y_TUNNUS)
    await hakijaPage.waitForEditSaved()

    await hakemusListPage.navigate(avustushakuID)
    await hakemusListPage.showUnfinished.check()
    await hakemusListPage.hakemusListing.waitFor({ timeout: 5000 })
    const rows = hakemusListPage.hakemusRows
    expect(await rows.count()).toBe(1)
    const row = rows.first()
    await row.locator('text=Keskeneräinen').waitFor()
  })

  await test.step('can be submitted by admin', async () => {
    await hakemusListPage.navigateToLatestHakemusArviointi(avustushakuID, true)
    await hakemusListPage.submitHakemus()
    await hakemusListPage.waitForSave()

    await hakemusListPage.navigate(avustushakuID)
    await hakemusListPage.showUnfinished.uncheck()
    expect(await hakemusListPage.hakemusRows.count()).toBe(1)
    expect(
      await hakemusListPage.hakemusRows.first().locator('text=Käsittelemättä').isVisible()
    ).toBeTruthy()
    await expect(page.locator('[data-test-id="submit-hakemus"]')).toHaveCount(0)
  })
})
