import { Browser, Page } from 'puppeteer'
import {
  aria,
  clearAndType,
  clickClojureScriptKäliTab,
  clickElement,
  createRandomHakuValues,
  expectingLoadingProgressBar,
  getElementInnerText,
  getFirstPage,
  getHakemusTokenAndRegisterNumber,
  log,
  mkBrowser,
  navigate,
  setPageErrorConsoleLogger,
} from '../test-util'
import { ratkaiseMuutoshakemusEnabledAvustushaku } from '../muutoshakemus/muutospaatosprosessi-util'

jest.setTimeout(400_000)

describe("Maksatukset", () => {
  let browser: Browser
  let page: Page
  let hakemusID: number

  beforeAll(async () => {
    browser = await mkBrowser()
    page = await getFirstPage(browser)
    setPageErrorConsoleLogger(page)
  })

  afterAll(async () => {
    await page.close()
    await browser.close()
  })

  beforeEach(() => {
    log(`Starting test: ${expect.getState().currentTestName}`)
  })

  afterEach(() => {
    log(`Finished test: ${expect.getState().currentTestName}`)
  })

  beforeAll(async () => {
    const x = await ratkaiseMuutoshakemusEnabledAvustushaku(page, createRandomHakuValues("Maksatukset"), {
      contactPersonEmail: "erkki.esimerkki@example.com",
      contactPersonName: "Erkki Esimerkki",
      contactPersonPhoneNumber: "666",
      projectName: "Rahassa kylpijät Ky Ay Oy",
    })
    hakemusID = x.hakemusID

    await navigate(page, "/admin-ui/payments/")
  })

  it("should work", async () => {
    await clickElement(page, "#Tositepäivämäärä")
    await page.keyboard.press("Enter")

    await clearAndType(page, "[data-test-id=maksatukset-asiakirja--asha-tunniste]", "asha pasha")
    await clearAndType(page, "[data-test-id=maksatukset-asiakirja--esittelijan-sahkopostiosoite]", "essi.esittelija@example.com")
    await clearAndType(page, "[data-test-id=maksatukset-asiakirja--hyvaksyjan-sahkopostiosoite]", "hygge.hyvaksyja@example.com")
    await clickElement(page, "[data-test-id=maksatukset-asiakirja--lisaa-asiakirja]")

    await expectingLoadingProgressBar(page, "Lähetetään maksatuksia", () =>
      aria(page, "Lähetä maksatukset").then(e => e.click()))

    await gotoLähetetytMaksatuksetTab(page)
    const { "register-number": registerNumber } = await getHakemusTokenAndRegisterNumber(hakemusID)

    expect(await getBatchPitkäViite(page, 1)).toEqual(registerNumber)
    expect(await getBatchStatus(page, 1)).toEqual("Lähetetty")
    expect(await getBatchToimittajanNimi(page, 1)).toEqual("Akaan kaupunki")
    expect(await getBatchHanke(page, 1)).toEqual("Rahassa kylpijät Ky Ay Oy")
    expect(await getBatchMaksuun(page, 1)).toEqual("99,999 €")
    expect(await getBatchIBAN(page, 1)).toEqual("FI95 6682 9530 0087 65")
    expect(await getBatchLKPTili(page, 1)).toEqual("82010000")
    expect(await getBatchTaKpTili(page, 1)).toEqual("29103020")
    expect(await getTiliönti(page, 1)).toEqual("99,999 €")
  })
})

const getBatchPitkäViite = getSentPaymentBatchColumn(1)
const getBatchStatus = getSentPaymentBatchColumn(2)
const getBatchToimittajanNimi = getSentPaymentBatchColumn(3)
const getBatchHanke = getSentPaymentBatchColumn(4)
const getBatchMaksuun = getSentPaymentBatchColumn(5)
const getBatchIBAN = getSentPaymentBatchColumn(6)
const getBatchLKPTili = getSentPaymentBatchColumn(7)
const getBatchTaKpTili = getSentPaymentBatchColumn(8)
const getTiliönti = getSentPaymentBatchColumn(9)

async function gotoLähetetytMaksatuksetTab(page: Page): Promise<void> {
  await clickClojureScriptKäliTab(page, "sent-payments-tab")
}

function getSentPaymentBatchColumn(column: number) {
  return async (page: Page, paymentBatchRow: number): Promise<string | undefined> => {
    const rowSelector = (n: number) => `[data-test-id=sent-payment-batches-table] tbody > tr:nth-child(${n})`
    return await getElementInnerText(page, `${rowSelector(paymentBatchRow)} > td:nth-child(${column})`)
  }
}