import { expect } from '@playwright/test'
import { readFileSync } from 'fs'
import * as path from 'path'

import { muutoshakemusTest as test } from '../../fixtures/muutoshakemusTest'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { HakulomakePage } from '../../pages/virkailija/hakujen-hallinta/HakulomakePage'
import { expectToBeDefined } from '../../utils/util'

const puuttuvaYhteyshenkilonNimiJson = readFileSync(
  path.join(__dirname, 'puuttuva-yhteyshenkilon-nimi.json'),
  'utf8'
)
const puuttuvaYhteyshenkilonNimiJaPuhelinnumeroJson = readFileSync(
  path.join(__dirname, 'puuttuva-yhteyshenkilon-nimi-ja-puhelinnumero.json'),
  'utf8'
)

test.describe('Form editor muutoshakukelpoisuus message', () => {
  test('tells that avustushaku is muutoshakukelpoinen', async ({ avustushakuID, page }) => {
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    await hakujenHallintaPage.navigateToFormEditor(avustushakuID)
    const okBannerText = await page.innerText('[data-test-id="validation-ok"]')
    expect(okBannerText).toEqual(
      'Lomake on muutoshakukelpoinenMuutoshakulomake toimitetaan avustuksen saajille automaattisesti päätösviestin yhteydessä'
    )
  })

  test('tells user about one missing field', async ({ page, hakuProps, userCache }) => {
    expectToBeDefined(userCache)
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    await hakujenHallintaPage.createHakuWithLomakeJson(puuttuvaYhteyshenkilonNimiJson, hakuProps)
    const formEditorPage = HakulomakePage(page)
    await expect(formEditorPage.locators.lomakeWarning.nth(1)).toHaveText(
      'Lomakkeesta puuttuu muutoshakemukselle tarpeellinen kenttä. Muutoshaku ei ole mahdollista.'
    )

    await formEditorPage.locators.lomakeWarningBtn.nth(1).click()

    await expect(formEditorPage.locators.lomakeWarningId).toContainText('applicant-name')
    await expect(formEditorPage.locators.lomakeWarningLabel).toContainText('Yhteyshenkilön nimi')
  })

  test('tells user about multiple missing fields', async ({ page, hakuProps, userCache }) => {
    expectToBeDefined(userCache)
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    await hakujenHallintaPage.createHakuWithLomakeJson(
      puuttuvaYhteyshenkilonNimiJaPuhelinnumeroJson,
      hakuProps
    )
    const formEditorPage = HakulomakePage(page)
    await expect(formEditorPage.locators.lomakeWarning.nth(1)).toHaveText(
      'Lomakkeesta puuttuu 2 muutoshakemukselle tarpeellista kenttää. Muutoshaku ei ole mahdollista.'
    )
    await formEditorPage.locators.lomakeWarningBtn.nth(1).click()
    await expect(formEditorPage.locators.lomakeWarningId).toContainText([
      'applicant-name',
      'textField-0',
    ])
    await expect(formEditorPage.locators.lomakeWarningLabel).toContainText([
      'Yhteyshenkilön nimi',
      'Yhteyshenkilön puhelinnumero',
    ])
  })
})
