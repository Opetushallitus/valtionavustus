import {expect, test} from '@playwright/test';
import { muutoshakemusTest } from '../fixtures/muutoshakemusTest';
import { HakemustenArviointiPage } from '../pages/hakemustenArviointiPage'
import { HakujenHallintaPage } from '../pages/hakujenHallintaPage'

test.setTimeout(5000)

muutoshakemusTest.use({
  hakuProps: ({hakuProps}, use) => use({
    ...hakuProps,
    selectionCriteria: [
      'Onko hyvin tehty?',
      'Onko mittää järkee?',
    ],
  })
})

muutoshakemusTest.only('Stars are shown on listing page', async ({ page, avustushakuID, submittedHakemus }) => {
  expect(submittedHakemus).toBeDefined()

  const hakemustenArviointiPage = new HakemustenArviointiPage(page)
  const hakujenHallintaPage = new HakujenHallintaPage(page)

  await hakujenHallintaPage.navigate(avustushakuID)
  await hakujenHallintaPage.closeAvustushakuByChangingEndDateToPast()
  const hakemusId = await hakemustenArviointiPage.navigateToLatestHakemusArviointi(avustushakuID)
  await hakemustenArviointiPage.navigate(avustushakuID)
  await hakemustenArviointiPage.selectValmistelijaForHakemus(hakemusId, '_ valtionavustus')

  await hakemustenArviointiPage.selectArvioijaForHakemus(hakemusId, '_ valtionavustus')

  await hakemustenArviointiPage.navigate(avustushakuID)
  await hakemustenArviointiPage.openUkotusModal(hakemusId)
  await page.locator(`[aria-label="Poista _ valtionavustus arvioijan roolista"]`).waitFor()
  await page.locator(`[aria-label="Poista _ valtionavustus valmistelijan roolista"]`).waitFor()
  await hakemustenArviointiPage.closeUkotusModal()
  await hakemustenArviointiPage.setSelectionCriteriaStars(1, 4)
  await hakemustenArviointiPage.setSelectionCriteriaStars(2, 1)
  await page.reload()
  const hakemusScore = await hakemustenArviointiPage.getHakemusScore(hakemusId)
  await hakemustenArviointiPage.navigate(avustushakuID, { newListingUi: true})
  expect(hakemusScore).toEqual('2.5')
})
