import { Browser, Page } from 'puppeteer'
import * as fs from "fs"
import * as path from "path"
import {
  createRandomHakuValues,
  getFirstPage,
  mkBrowser,
  setPageErrorConsoleLogger,
  setupTestLogging,
  clickFormSaveAndWait,
  clearAndSet,
  clickElementWithTestId,
  getElementInnerText,
  navigate
} from '../test-util'

import {
  createRandomCodeValues,
  createMuutoshakemusEnabledHaku
} from '../muutoshakemus/muutospaatosprosessi-util'

jest.setTimeout(400_000)

const puuttuvaYhteyshenkilonNimiJson = fs.readFileSync(path.join(__dirname, 'puuttuva-yhteyshenkilon-nimi.json'), 'utf8')
const puuttuvaYhteyshenkilonNimiJaPuhelinnumeroJson = fs.readFileSync(path.join(__dirname, 'puuttuva-yhteyshenkilon-nimi-ja-puhelinnumero.json'), 'utf8')

describe("Muutoshakukelpoisuus", () => {
  let browser: Browser
  let page: Page
  let avustushakuId: number

  beforeAll(async () => {
    browser = await mkBrowser()
    page = await getFirstPage(browser)
    setPageErrorConsoleLogger(page)
  })

  afterAll(async () => {
    await page.close()
    await browser.close()
  })

  setupTestLogging()

    beforeEach(async () => {
    const randomHakuValues = createRandomHakuValues("Muutoshakukelpoisuus")
    const codes = await createRandomCodeValues(page)
    const { avustushakuID } = await createMuutoshakemusEnabledHaku(page, randomHakuValues.registerNumber, randomHakuValues.avustushakuName, codes)
    avustushakuId = avustushakuID
  })

  it("tells user about one missing field", async () => {
    await navigate(page, `/admin/form-editor/?avustushaku=${avustushakuId}`)
    await clearAndSet(page, ".form-json-editor textarea", puuttuvaYhteyshenkilonNimiJson)
    await clickFormSaveAndWait(page)
    
    const warningBannerText = await getElementInnerText(page, '[data-test-id="muutoshakukelpoisuus-warning"]')

    expect(warningBannerText).toEqual("Lomakkeesta puuttuu muutoshakemukselle tarpeellinen kenttä. Muutoshaku ei ole mahdollista.")

    await clickElementWithTestId(page, "muutoshakukelpoisuus-warning-button")

    const missingFieldIds = await getElementInnerTexts(page,  "muutoshakukelpoisuus-dropdown-item-id")
    expect(missingFieldIds).toContain("applicant-name")

    const missingFieldLabels = await getElementInnerTexts(page,  "muutoshakukelpoisuus-dropdown-item-label")
    expect(missingFieldLabels).toContain("Yhteyshenkilön nimi")
  })

  it("tells user about multiple missing fields", async () => {
    await navigate(page, `/admin/form-editor/?avustushaku=${avustushakuId}`)
    await clearAndSet(page, ".form-json-editor textarea", puuttuvaYhteyshenkilonNimiJaPuhelinnumeroJson)
    await clickFormSaveAndWait(page)

    const warningBannerText = await getElementInnerText(page,  '[data-test-id="muutoshakukelpoisuus-warning"]')

    expect(warningBannerText).toEqual("Lomakkeesta puuttuu 2 muutoshakemukselle tarpeellista kenttää. Muutoshaku ei ole mahdollista.")

    await clickElementWithTestId(page, "muutoshakukelpoisuus-warning-button")

    const missingFieldIds = await getElementInnerTexts(page,  "muutoshakukelpoisuus-dropdown-item-id")
    expect(missingFieldIds).toContain("applicant-name")
    expect(missingFieldIds).toContain("textField-0")

    const missingFieldLabels = await getElementInnerTexts(page,  "muutoshakukelpoisuus-dropdown-item-label")
    expect(missingFieldLabels).toContain("Yhteyshenkilön nimi")
    expect(missingFieldLabels).toContain("Yhteyshenkilön puhelinnumero")
  })
})

async function getElementInnerTexts(page: Page, selector: string) {
  return await page.evaluate((selector: string) => Array.from(document.getElementsByClassName(selector)).map((node: Element) => (node as HTMLElement).innerText), selector);
}
