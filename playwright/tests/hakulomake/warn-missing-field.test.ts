import { budjettimuutoshakemusTest } from '../../fixtures/budjettimuutoshakemusTest'
import { expect } from '@playwright/test'
import { HakujenHallintaPage } from '../../pages/hakujenHallintaPage'
import fs from 'fs/promises'
import path from 'path'
import { HakulomakePage } from '../../pages/hakujen-hallinta/HakulomakePage'

budjettimuutoshakemusTest(
  'warns missing financing-plan',
  async ({ hakuProps, userCache, page }, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 40_000)
    expect(userCache).toBeDefined()
    const muutoshakemusEnabledHakuLomakeJson = await fs.readFile(
      path.join(__dirname, '../../fixtures/budjettimuutos.hakulomake.json'),
      'utf8'
    )
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const formEditorPage = HakulomakePage(page)
    const { avustushakuID } = await hakujenHallintaPage.createHakuWithLomakeJson(
      muutoshakemusEnabledHakuLomakeJson,
      hakuProps
    )
    const formEditor = await hakujenHallintaPage.navigateToFormEditor(avustushakuID)
    await expect(formEditorPage.locators.lomakeWarning.nth(1)).toBeHidden()
    const badBuduLomake = await fs.readFile(
      path.join(__dirname, '../../fixtures/budjettimuutos-bad-budget.hakulomake.json'),
      'utf8'
    )
    await formEditor.changeLomakeJson(badBuduLomake)
    await formEditor.saveForm()
    await expect(formEditorPage.locators.lomakeWarning.nth(1)).toContainText(
      'Lomakkeesta puuttuu muutoshakemukselle tarpeellinen kenttä. Muutoshaku ei ole mahdollista.'
    )
    await formEditorPage.locators.lomakeWarningBtn.nth(1).click()
    await expect(formEditorPage.locators.lomakeWarningId).toContainText('financing-plan')
  }
)
