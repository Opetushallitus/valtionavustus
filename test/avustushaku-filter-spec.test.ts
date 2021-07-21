import { Browser, Page } from 'puppeteer'
import {
  getFirstPage,
  log,
  mkBrowser,
  setPageErrorConsoleLogger,
  createRandomHakuValues,
  createValidCopyOfEsimerkkihakuAndReturnTheNewId,
  navigate,
  selectAvustushakuFromDropdown, publishAvustushaku,
} from './test-util'

jest.setTimeout(400_000)

describe('Avustushaku filtering', () => {
  let browser: Browser
  let page: Page

  beforeEach(() => {
    log(`Starting test: ${expect.getState().currentTestName}`)
  })

  beforeAll(async () => {
    browser = await mkBrowser()
    page = await getFirstPage(browser)
    setPageErrorConsoleLogger(page)
  })

  afterEach(() => {
    log(`Finished test: ${expect.getState().currentTestName}`)
  })

  afterAll(async () => {
    await page.close()
    await browser.close()
  })

  describe('When avustushaku #1 has been created', () => {
    const haku1 = createRandomHakuValues('filter')
    let avustushaku1ID: number

    beforeAll(async () => {
      avustushaku1ID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page, haku1.avustushakuName, haku1.registerNumber)
      await publishAvustushaku(page)
    })

    describe('And avustushaku #2 has been created and virkailija navigates to hakemusten arviointi tab', () => {
      const haku2 = createRandomHakuValues('filter')

      beforeAll(async () => {
        const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page, haku2.avustushakuName, haku2.registerNumber)
        await publishAvustushaku(page)
        await navigate(page, `/avustushaku/${avustushakuID}/`)
      })

      it('Avustushaku filter is visible', async () => {
        const filterElement = await page.waitForSelector('#avustushaku-dropdown .dropdown-list')
        const filterElementWidth = await page.evaluate(e => e.offsetWidth, filterElement)
        expect(filterElementWidth).toBeGreaterThanOrEqual(400)
      })

      describe('And virkailija selects avustushaku #1 from the filter', () => {
        beforeAll(async () => {
          await selectAvustushakuFromDropdown(page, haku1.avustushakuName)
        })

        it('Virkailija is sent to avustushaku #1 page', async () => {
          expect(await page.url()).toContain(`avustushaku/${avustushaku1ID}/`)
        })

      })
    })
  })
})
