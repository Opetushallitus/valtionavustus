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
} from '../test-util'

import {
  createCodeValuesForTest,
  createMuutoshakemusEnabledHaku
} from '../muutoshakemus/muutospaatosprosessi-util'

jest.setTimeout(400_000)

const puuttuvaYhteyshenkilonNimiJson = fs.readFileSync(path.join(__dirname, '../muutoshakukelpoisuus/puuttuva-yhteyshenkilon-nimi.json'), 'utf8')

describe("Tallennus", () => {
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

  it("save button becomes disabled after save", async () => {
    await clickElementWithText(page, "span", "Hakulomake")

    await page.waitForXPath("//button[contains(., 'Tallenna')][@disabled='']")

    await clearAndSet(page, ".form-json-editor textarea", puuttuvaYhteyshenkilonNimiJson)

    await page.waitForXPath("//button[contains(., 'Tallenna')][not(@disabled='')]")

    await clickFormSaveAndWait(page, avustushakuID)

    await page.waitForXPath("//button[contains(., 'Tallenna')][@disabled='']")
  })
})
