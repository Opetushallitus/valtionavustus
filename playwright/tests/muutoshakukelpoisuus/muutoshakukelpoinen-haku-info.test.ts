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

  test('shows field ids on the hakemus edit page', async ({ avustushakuID, page }) => {
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const formEditorPage = await hakujenHallintaPage.navigateToFormEditor(avustushakuID)
    const fieldIdInnerTexts = await formEditorPage.getFieldIds()
    expect(fieldIdInnerTexts).toEqual([
      'name',
      'duration',
      'duration-help',
      'p-1',
      'applicant-info',
      'organization-fieldset',
      'organization',
      'organization-email',
      'business-id',
      'applicant-fieldset',
      'applicant-name',
      'primary-email',
      'textField-0',
      'radioButton-0',
      'koodistoField-1',
      'signatories-fieldset',
      'signatories-fieldset-1',
      'signatories-fieldset-1.name',
      'signatories-fieldset-1.email',
      'bank-fieldset',
      'bank-iban',
      'bank-bic',
      'h3-1',
      'p-0',
      'textField-2',
      'textField-1',
      'project-info',
      'project-name',
      'language',
      'nayta-tarkennus',
      'other-organizations',
      'other-organizations-1',
      'other-organizations.other-organizations-1.contactperson',
      'other-organizations.other-organizations-1.email',
      'checkboxButton-0',
      'project-plan',
      'selection-criteria',
      'togglable-wrapper-cp',
      'pp-basic-education',
      'pp-upper-secondary',
      'checkboxButton-1',
      'h3-0',
      'project-description',
      'project-description-1',
      'project-description.project-description-1.goal',
      'project-description.project-description-1.activity',
      'project-description.project-description-1.result',
      'project-effectiveness',
      'project-begin',
      'project-end',
      'financing-plan',
      'financing-plan-help',
      'vat-included',
      'budget',
    ])
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
