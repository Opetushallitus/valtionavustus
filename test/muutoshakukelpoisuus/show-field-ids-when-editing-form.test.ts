import { Browser, Page } from 'puppeteer'
import {
  createRandomHakuValues,
  getFirstPage,
  mkBrowser,
  setPageErrorConsoleLogger,
  setupTestLoggingAndScreenshots,
  clickElementWithText,
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

    const fieldHeaders = await page.$$(".soresu-field-header")
    const fieldIds = await page.$$(".soresu-field-id")

    expect(fieldIds).toHaveLength(fieldHeaders.length)

    const fieldIdInnerTextPromises = fieldIds.map(el => el.evaluate(node => (node as HTMLElement).innerText))
    const fieldIdInnerTexts = await Promise.all(fieldIdInnerTextPromises);
    const applicantNameId = await fieldIdInnerTexts.find(innerText => innerText === "applicant-name")

    expect(applicantNameId).toBeDefined()
  })
})
