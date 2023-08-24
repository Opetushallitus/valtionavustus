import { expect, test } from '@playwright/test'

import { muutoshakemusTest } from '../../../fixtures/muutoshakemusTest'
import { HakemustenArviointiPage } from '../../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { HakujenHallintaPage } from '../../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { answers } from '../../../utils/constants'

test.setTimeout(180000)

muutoshakemusTest.use({
  hakuProps: ({ hakuProps }, use) =>
    use({
      ...hakuProps,
      selectionCriteria: ['Onko hyvin tehty?', 'Onko mittää järkee?'],
    }),
})

muutoshakemusTest(
  'Ukotusmodal hanke changes when user changes hanke from list',
  async ({ page, submitMultipleHakemuses, avustushakuID }) => {
    expect(submitMultipleHakemuses).toBeDefined()
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    const hakemusId = await hakemustenArviointiPage.navigateToLatestHakemusArviointi(avustushakuID)
    await hakemustenArviointiPage.closeHakemusDetails()
    await hakemustenArviointiPage.openUkotusModal(hakemusId)
    await expect(page.getByTestId('ukotusModal')).toContainText('Pieni säätö')
    await hakemustenArviointiPage.clickHakemusByHanke('Säätö jatkuu...')
    await expect(page.getByTestId('ukotusModal')).toContainText('Säätö jatkuu...')
  }
)

muutoshakemusTest(
  'Valmistelija as an arvostelija',
  async ({ page, avustushakuID, submittedHakemus }) => {
    expect(submittedHakemus).toBeDefined()

    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    const hakujenHallintaPage = new HakujenHallintaPage(page)

    const haunTiedotPage = await hakujenHallintaPage.navigate(avustushakuID)
    await haunTiedotPage.closeAvustushakuByChangingEndDateToPast()
    const hakemusId = await hakemustenArviointiPage.navigateToLatestHakemusArviointi(avustushakuID)
    await hakemustenArviointiPage.closeHakemusDetails()
    await hakemustenArviointiPage.selectValmistelijaForHakemus(hakemusId, '_ valtionavustus')

    await test.step('can be set as arvioija in addition to valmistelija', async () => {
      await hakemustenArviointiPage.selectArvioijaForHakemus(hakemusId, '_ valtionavustus')
      await hakemustenArviointiPage.openUkotusModal(hakemusId)
      await expect(
        page.locator(`[aria-label="Poista _ valtionavustus arvioijan roolista"]`)
      ).toBeVisible()
      await expect(
        page.locator(`[aria-label="Poista _ valtionavustus valmistelijan roolista"]`)
      ).toBeVisible()
      await hakemustenArviointiPage.closeUkotusModal()
    })

    await test.step('can set arvio', async () => {
      await hakemustenArviointiPage.selectHakemusFromList(answers.projectName)
      await hakemustenArviointiPage.setSelectionCriteriaStars(1, 4)
      await hakemustenArviointiPage.setSelectionCriteriaStars(2, 4)
      const hakemusScore = await hakemustenArviointiPage.getHakemusScore(hakemusId)
      expect(hakemusScore).toEqual('4')
    })

    await test.step('can still do things a valmistelija can do', async () => {
      await hakemustenArviointiPage.navigateToLatestHakemusArviointi(avustushakuID)
      await expect(page.locator('[data-test-id="virkailija-edit-hakemus"]')).toBeEnabled()
      await expect(page.locator('[data-test-id="request-change-button"]')).toBeEnabled()

      await page.click('label[for="useDetailedCosts-true"]')
      await page.fill('[id="budget-edit-personnel-costs-row.amount"]', '100000')

      await page.click('label[for="set-arvio-status-accepted"]')

      await page.locator('#close-hakemus-button').click()
      await expect(page.locator('[data-test-class="hakemus-status-cell"]')).toContainText(
        'Hyväksytty'
      )
      await expect(page.locator('[data-test-class="granted-sum-cell"]')).toContainText('99 999')
    })
  }
)
