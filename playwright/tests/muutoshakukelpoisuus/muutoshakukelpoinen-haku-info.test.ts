import { expect, Page } from '@playwright/test'
import { readFileSync } from 'fs'
import * as path from 'path'

import { muutoshakemusTest as test } from '../../fixtures/muutoshakemusTest'
import { HakujenHallintaPage } from '../../pages/hakujenHallintaPage'

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
    const okBannerText = await page.innerText('[data-test-id="muutoshakukelpoisuus-ok"]')
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

  test('tells user about one missing field', async ({ page, hakuProps }) => {
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    await hakujenHallintaPage.createHakuWithLomakeJson(puuttuvaYhteyshenkilonNimiJson, hakuProps)

    await page.waitForSelector(
      'text="Lomakkeesta puuttuu muutoshakemukselle tarpeellinen kenttä. Muutoshaku ei ole mahdollista."'
    )

    await page.evaluate(() => window.scrollTo(0, 0))
    await page.click('[data-test-id="muutoshakukelpoisuus-warning-button"]')

    await expectMissingFieldId(page, 'applicant-name')
    await expectMissingFieldLabel(page, 'Yhteyshenkilön nimi')
  })

  test('tells user about multiple missing fields', async ({ page, hakuProps }) => {
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    await hakujenHallintaPage.createHakuWithLomakeJson(
      puuttuvaYhteyshenkilonNimiJaPuhelinnumeroJson,
      hakuProps
    )

    await page.waitForSelector(
      'text="Lomakkeesta puuttuu 2 muutoshakemukselle tarpeellista kenttää. Muutoshaku ei ole mahdollista."'
    )

    await page.evaluate(() => window.scrollTo(0, 0))
    await page.click('[data-test-id="muutoshakukelpoisuus-warning-button"]')

    expectMissingFieldId(page, 'applicant-name')
    expectMissingFieldId(page, 'textField-0')

    expectMissingFieldLabel(page, 'Yhteyshenkilön nimi')
    expectMissingFieldLabel(page, 'Yhteyshenkilön puhelinnumero')
  })
})

const expectMissingFieldId = (page: Page, fieldId: string) =>
  page.waitForSelector(`.muutoshakukelpoisuus-dropdown-item-id >> text="${fieldId}"`)
const expectMissingFieldLabel = (page: Page, labelText: string) =>
  page.waitForSelector(`.muutoshakukelpoisuus-dropdown-item-label >> text="${labelText}"`)
