import {Browser, Page} from "puppeteer"
import {
  clickElementWithText,
  getFirstPage,
  log,
  mkBrowser,
  navigateToLoppuselvitysTab,
  ratkaiseAvustushaku,
  setPageErrorConsoleLogger,
  waitForElementWithText
} from "../test-util"

jest.setTimeout(400_000)

describe("Loppuselvitys tab in hakemuksen arviointi", () => {
  let browser: Browser
  let page: Page

  let avustushakuID: number
  let hakemusID: number

  beforeEach(() => {
    log(`Starting test: ${expect.getState().currentTestName}`)
  })

  beforeAll(async () => {
    browser = await mkBrowser()
    page = await getFirstPage(browser)
    setPageErrorConsoleLogger(page)

    const haku = await ratkaiseAvustushaku(page)
    avustushakuID = haku.avustushakuID
    hakemusID = haku.hakemusID

    await navigateToLoppuselvitysTab(page, avustushakuID, hakemusID)
  })

  afterEach(() => {
    log(`Finished test: ${expect.getState().currentTestName}`)
  })

  afterAll(async () => {
    await page.close()
    await browser.close()
  })

  it('should have link to correct loppuselvitys form for the hakemus', async () => {
    await clickElementWithText(page, 'a', 'Linkki lomakkeelle')
    const [, loppuselvitysFormPage] = await browser.pages()
    await loppuselvitysFormPage.waitForNavigation()
    
    await waitForElementWithText(loppuselvitysFormPage, 'h1', 'Loppuselvitys') 
    await waitForElementWithText(loppuselvitysFormPage, 'button', 'Lähetä käsiteltäväksi') 
  })
})
