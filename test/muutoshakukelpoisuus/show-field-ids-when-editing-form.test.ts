import { Browser, Page } from 'puppeteer'
import {
  createRandomHakuValues,
  getFirstPage,
  mkBrowser,
  navigate,
  setPageErrorConsoleLogger,
  setupTestLoggingAndScreenshots,
  toInnerText,
} from '../test-util'

import {
  createRandomCodeValues,
  createMuutoshakemusEnabledHaku
} from '../muutoshakemus/muutospaatosprosessi-util'

jest.setTimeout(400_000)

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

  setupTestLoggingAndScreenshots(() => page)

  beforeEach(async () => {
    const randomHakuValues = createRandomHakuValues("Muutoshakukelpoisuus")
    const codes = await createRandomCodeValues(page)
    const { avustushakuID } = await createMuutoshakemusEnabledHaku(page, randomHakuValues.registerNumber, randomHakuValues.avustushakuName, codes)
    avustushakuId = avustushakuID
  })

  it("every field header has a corresponding field id", async () => {
    await navigate(page, `/admin/form-editor/?avustushaku=${avustushakuId}`)

    const fieldHeaders = await page.$$(".soresu-field-title")
    const fieldIds = await page.$$(".soresu-field-id")
    const fieldIdInnerTexts = await Promise.all(fieldIds.map(el => el.evaluate(toInnerText)))

    expect(fieldIdInnerTexts).toHaveLength(fieldHeaders.length)

    const applicantNameId = fieldIdInnerTexts.find(innerText => innerText === "applicant-name")
    expect(applicantNameId).toBeDefined()
  })
})
