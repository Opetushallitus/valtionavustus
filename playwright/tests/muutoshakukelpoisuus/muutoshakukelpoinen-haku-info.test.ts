import { expect, Page } from '@playwright/test'
import { readFileSync } from 'fs'
import * as path from 'path'

import { muutoshakemusTest as test } from '../../fixtures/muutoshakemusTest'
import { HakujenHallintaPage } from '../../pages/hakujenHallintaPage'

const puuttuvaYhteyshenkilonNimiJson = readFileSync(path.join(__dirname, 'puuttuva-yhteyshenkilon-nimi.json'), 'utf8')
const puuttuvaYhteyshenkilonNimiJaPuhelinnumeroJson = readFileSync(path.join(__dirname, 'puuttuva-yhteyshenkilon-nimi-ja-puhelinnumero.json'), 'utf8')

test.describe('Form editor muutoshakukelpoisuus message', () => {

  test('tells that avustushaku is muutoshakukelpoinen', async ({ avustushakuID, page }) => {
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    await hakujenHallintaPage.navigateToFormEditor(avustushakuID)

    const okBannerText = await page.innerText('[data-test-id="muutoshakukelpoisuus-ok"]')
    expect(okBannerText).toEqual("Lomake on muutoshakukelpoinenMuutoshakulomake toimitetaan avustuksen saajille automaattisesti päätösviestin yhteydessä")
  })

  test("tells user about one missing field", async ({ page, hakuProps }) => {
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    await hakujenHallintaPage.createHakuWithLomakeJson(puuttuvaYhteyshenkilonNimiJson, hakuProps)

    await page.waitForSelector('text="Lomakkeesta puuttuu muutoshakemukselle tarpeellinen kenttä. Muutoshaku ei ole mahdollista."')

    await page.click('[data-test-id="muutoshakukelpoisuus-warning-button"]')

    await expectMissingFieldId(page, 'applicant-name')
    await expectMissingFieldLabel(page, 'Yhteyshenkilön nimi')
  })

  test("tells user about multiple missing fields", async ({ page, hakuProps }) => {
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    await hakujenHallintaPage.createHakuWithLomakeJson(puuttuvaYhteyshenkilonNimiJaPuhelinnumeroJson, hakuProps)

    await page.waitForSelector('text="Lomakkeesta puuttuu 2 muutoshakemukselle tarpeellista kenttää. Muutoshaku ei ole mahdollista."')

    await page.click('[data-test-id="muutoshakukelpoisuus-warning-button"]')

    expectMissingFieldId(page, 'applicant-name')
    expectMissingFieldId(page, 'textField-0')

    expectMissingFieldLabel(page, 'Yhteyshenkilön nimi')
    expectMissingFieldLabel(page, 'Yhteyshenkilön puhelinnumero')
  })

})

const expectMissingFieldId = (page: Page, fieldId: string) => page.waitForSelector(`.muutoshakukelpoisuus-dropdown-item-id >> text="${fieldId}"`)
const expectMissingFieldLabel = (page: Page, labelText: string) => page.waitForSelector(`.muutoshakukelpoisuus-dropdown-item-label >> text="${labelText}"`)
