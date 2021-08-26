import { Browser, Page } from 'puppeteer'
import {
  createRandomHakuValues,
  getFirstPage,
  mkBrowser,
  setPageErrorConsoleLogger,
  setupTestLoggingAndScreenshots,
  clickElementWithText,
  toInnerText,
} from '../test-util'

import {
  createCodeValuesForTest,
  createMuutoshakemusEnabledHaku
} from '../muutoshakemus/muutospaatosprosessi-util'

jest.setTimeout(400_000)

describe("Muutoshakukelpoisuus", () => {
  let browser: Browser
  let page: Page

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
    await createMuutoshakemusEnabledHaku(page, randomHakuValues.registerNumber, randomHakuValues.avustushakuName, codes)
  })

  it("every field header has a corresponding field id", async () => {
    await clickElementWithText(page, "span", "Hakulomake")

    const fieldHeaders = await page.$$(".soresu-field-title")
    const fieldIds = await page.$$(".soresu-field-id")
    const fieldIdInnerTexts = await Promise.all(fieldIds.map(el => el.evaluate(toInnerText)))

    expect(fieldIdInnerTexts).toHaveLength(fieldHeaders.length)

    const applicantNameId = fieldIdInnerTexts.find(innerText => innerText === "applicant-name")
    expect(applicantNameId).toBeDefined()
  })
})
