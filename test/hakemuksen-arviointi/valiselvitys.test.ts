import {Browser, Page} from "puppeteer"
import {
  clickElementWithText,
  getFirstPage,
  log,
  mkBrowser,
  navigateToValiselvitysTab,
  ratkaiseAvustushaku,
  setPageErrorConsoleLogger,
  waitForElementWithText,
  waitForNewTab
} from "../test-util"

jest.setTimeout(400_000)

describe("Väliselvitys tab in hakemuksen arviointi", () => {
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

    await navigateToValiselvitysTab(page, avustushakuID, hakemusID)
  })

  afterEach(() => {
    log(`Finished test: ${expect.getState().currentTestName}`)
  })

  afterAll(async () => {
    await page.close()
    await browser.close()
  })

  it('should have link to correct väliselvitys form for the hakemus', async () => {
    const [valiselvitysFormPage] = await Promise.all([
      waitForNewTab(page),
      clickElementWithText(page, 'a', 'Linkki lomakkeelle'),
    ])
    await valiselvitysFormPage.waitForNavigation()
    
    await waitForElementWithText(valiselvitysFormPage, 'h1', 'Väliselvitys') 
    await waitForElementWithText(valiselvitysFormPage, 'button', 'Lähetä käsiteltäväksi') 
  })
})
