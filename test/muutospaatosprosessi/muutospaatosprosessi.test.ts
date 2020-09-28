import { Page, Browser } from "puppeteer"
import {
  createValidCopyOfEsimerkkihakuAndReturnTheNewId,
  mkBrowser,
  getFirstPage
} from "../test-util"

jest.setTimeout(100_000)
describe("dummy", () => {
  let browser: Browser
  let page: Page

  beforeEach(async () => {
    browser = await mkBrowser()
    page = await getFirstPage(browser)
  })

  afterEach(async () => {
    await page.close()
    await browser.close()
  })

  test("dummy", async () => {
    const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)
    expect(avustushakuID).toHaveLength(19)
  })
})
