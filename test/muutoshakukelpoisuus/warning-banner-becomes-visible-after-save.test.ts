import { Browser, Page } from 'puppeteer'
import * as fs from "fs"
import * as path from "path"
import {
  createRandomHakuValues,
  getFirstPage,
  mkBrowser,
  setPageErrorConsoleLogger,
  setupTestLoggingAndScreenshots,
  clickElementWithText,
  clickFormSaveAndWait,
  clearAndSet,
  clickElementWithTestId,
  getElementInnerText
} from '../test-util'

import {
  createCodeValuesForTest,
  createMuutoshakemusEnabledHaku
} from '../muutoshakemus/muutospaatosprosessi-util'

jest.setTimeout(400_000)

const puuttuvaYhteyshenkilonNimiJson = fs.readFileSync(path.join(__dirname, 'puuttuva-yhteyshenkilon-nimi.json'), 'utf8')
const puuttuvaYhteyshenkilonNimiJaPuhelinnumeroJson = fs.readFileSync(path.join(__dirname, 'puuttuva-yhteyshenkilon-nimi-ja-puhelinnumero.json'), 'utf8')

describe("Muutoshakukelpoisuus", () => {
  let browser: Browser
  let page: Page
  let avustushakuID: number

  beforeAll(async () => {
    browser = await mkBrowser()
    page = await getFirstPage(browser)
    setPageErrorConsoleLogger(page)
  })

  afterAll(async () => {
    await page.close()
    await browser.close()
  })

  setupTestLoggingAndScreenshots(() => page)

  beforeEach(async () => {
    const randomHakuValues = createRandomHakuValues("Muutoshakukelpoisuus")
    const codes = await createCodeValuesForTest(page)
    const x = await createMuutoshakemusEnabledHaku(page, randomHakuValues.registerNumber, randomHakuValues.avustushakuName, codes)

    avustushakuID = x.avustushakuID
  })

  it("tells user about one missing field", async () => {
    await clickElementWithText(page, "span", "Hakulomake")
    await clearAndSet(page, ".form-json-editor textarea", puuttuvaYhteyshenkilonNimiJson)
    await clickFormSaveAndWait(page, avustushakuID)
    
    const warningBannerText = await getElementInnerText(page,  '[data-test-id="muutoshakukelpoisuus-warning"]')

    expect(warningBannerText).toEqual("Lomakkeesta puuttuu muutoshakemukselle tarpeellinen kenttä. Muutoshaku ei ole mahdollista.")

    await clickElementWithTestId(page, "muutoshakukelpoisuus-warning-button")

    const missingFieldIds = await getElementInnerTexts(page,  "muutoshakukelpoisuus-dropdown-item-id")

    expect(missingFieldIds).toContain("applicant-name")
    
  })

  it("tells user about multiple missing fields", async () => {
    await clickElementWithText(page, "span", "Hakulomake")
    await clearAndSet(page, ".form-json-editor textarea", puuttuvaYhteyshenkilonNimiJaPuhelinnumeroJson)
    await clickFormSaveAndWait(page, avustushakuID)
    
    const warningBannerText = await getElementInnerText(page,  '[data-test-id="muutoshakukelpoisuus-warning"]')

    expect(warningBannerText).toEqual("Lomakkeesta puuttuu 2 muutoshakemukselle tarpeellista kenttää. Muutoshaku ei ole mahdollista.")

    await clickElementWithTestId(page, "muutoshakukelpoisuus-warning-button")

    const missingFieldIds = await getElementInnerTexts(page,  "muutoshakukelpoisuus-dropdown-item-id")

    expect(missingFieldIds).toContain("applicant-name")
    expect(missingFieldIds).toContain("textField-0")
  })
})

async function getElementInnerTexts(page: Page, selector: string) {
  return await page.evaluate((selector: string) => Array.from(document.getElementsByClassName(selector)).map((element: Element) => (element as HTMLElement).innerText), selector);
}
