import {expect, Page} from "@playwright/test"
import { muutoshakemusTest as test } from "../../fixtures/muutoshakemusTest";
import {KoodienhallintaPage} from "../../pages/koodienHallintaPage";
import {
  clickElementWithText,
  getElementAttribute,
  getElementInnerText,
  waitForClojureScriptLoadingDialogHidden,
  waitForClojureScriptLoadingDialogVisible,
  waitForElementWithText,
} from '../../utils/util'
import {
  getHakemusTokenAndRegisterNumber
} from '../../utils/emails'
import {
  VIRKAILIJA_URL
} from '../../utils/constants'
import {
  navigate
} from '../../utils/navigate'
import axios from 'axios'
import moment from "moment"

const correctOVTTest = test.extend({
  codes: async ({page}, use) => {
    const codes = { operationalUnit: '6600105300', operation: '3425324634', project: '523452346' }
    const koodienHallintaPage = new KoodienhallintaPage(page)
    await koodienHallintaPage.createCodeValues(codes)
    await use(codes)
  },
})

test.setTimeout(400000)
correctOVTTest.setTimeout(400000)

correctOVTTest('Maksatukset uses correct OVT when the operational unit is Palvelukeskus', async ({page, hakemus: {hakemusID}, codes: codeValues}) => {

    await navigate(page, "/admin-ui/payments/")
    await fillInMaksueranTiedot(page, "asha pasha", "essi.esittelija@example.com", "hygge.hyvaksyja@example.com")
    const dueDate = await getElementAttribute(page, '[id="Eräpäivä"]', 'value')
    if (!dueDate) throw new Error('Cannot find due date from form')

    await sendMaksatukset(page)
    await reloadPaymentPage(page)

    await gotoLähetetytMaksatuksetTab(page)
    const { "register-number": registerNumber } = await getHakemusTokenAndRegisterNumber(hakemusID)
    const pitkaviite = `${registerNumber}_1 Erkki Esimerkki`

    expect(await getBatchPitkäViite(page, 1)).toEqual(pitkaviite)
    expect(await getBatchStatus(page, 1)).toEqual("Lähetetty")
    expect(await getBatchToimittajanNimi(page, 1)).toEqual("Akaan kaupunki")
    expect(await getBatchHanke(page, 1)).toEqual("Rahassa kylpijät Ky Ay Oy")
    expect(await getBatchMaksuun(page, 1)).toEqual("99,999 €")
    expect(await getBatchIBAN(page, 1)).toEqual("FI95 6682 9530 0087 65")
    expect(await getBatchLKPTili(page, 1)).toEqual("82010000")
    expect(await getBatchTaKpTili(page, 1)).toEqual("29103020")
    expect(await getTiliönti(page, 1)).toEqual("99,999 €")


    await putMaksupalauteToMaksatuspalveluAndProcessIt(`
      <?xml version="1.0" encoding="UTF-8" standalone="no"?>
      <VA-invoice>
        <Header>
          <Pitkaviite>${pitkaviite}</Pitkaviite>
          <Maksupvm>2018-06-08</Maksupvm>
        </Header>
      </VA-invoice>
    `)

    await reloadPaymentPage(page)
    await gotoLähetetytMaksatuksetTab(page)
    expect(await getBatchStatus(page, 1)).toEqual("Maksettu")

    const maksatukset = await getAllMaksatuksetFromMaksatuspalvelu()
    expect(maksatukset).toContainEqual(getExpectedPaymentXML(codeValues.project, codeValues.operation, codeValues.operationalUnit, pitkaviite, `${registerNumber}_1`, dueDate, '00372769790122'))
  })

test('work with pitkaviite without contact person name', async ({page, avustushakuID, hakemus: {hakemusID}}) => {
    await navigate(page, "/admin-ui/payments/")

    await fillInMaksueranTiedot(page, "asha pasha", "essi.esittelija@example.com", "hygge.hyvaksyja@example.com")

    await sendMaksatukset(page)

    await removeStoredPitkäviiteFromAllAvustushakuPayments(avustushakuID)
    await reloadPaymentPage(page)

    await gotoLähetetytMaksatuksetTab(page)
    const { "register-number": registerNumber } = await getHakemusTokenAndRegisterNumber(hakemusID)
    const pitkaviite = registerNumber

    expect(await getBatchPitkäViite(page, 1)).toEqual(pitkaviite)
    expect(await getBatchStatus(page, 1)).toEqual("Lähetetty")
    expect(await getBatchToimittajanNimi(page, 1)).toEqual("Akaan kaupunki")
    expect(await getBatchHanke(page, 1)).toEqual("Rahassa kylpijät Ky Ay Oy")
    expect(await getBatchMaksuun(page, 1)).toEqual("99,999 €")
    expect(await getBatchIBAN(page, 1)).toEqual("FI95 6682 9530 0087 65")
    expect(await getBatchLKPTili(page, 1)).toEqual("82010000")
    expect(await getBatchTaKpTili(page, 1)).toEqual("29103020")
    expect(await getTiliönti(page, 1)).toEqual("99,999 €")

    await putMaksupalauteToMaksatuspalveluAndProcessIt(`
      <?xml version="1.0" encoding="UTF-8" standalone="no"?>
      <VA-invoice>
        <Header>
          <Pitkaviite>${pitkaviite}</Pitkaviite>
          <Maksupvm>2018-06-08</Maksupvm>
        </Header>
      </VA-invoice>
    `)

    await reloadPaymentPage(page)
    await gotoLähetetytMaksatuksetTab(page)
    expect(await getBatchStatus(page, 1)).toEqual("Maksettu")
  })

test('work with pitkaviite with contact person name', async ({page, hakemus: {hakemusID}, codes: { project, operation, operationalUnit}}) => {
    await navigate(page, "/admin-ui/payments/")

    await fillInMaksueranTiedot(page, "asha pasha", "essi.esittelija@example.com", "hygge.hyvaksyja@example.com")
    const dueDate = await getElementAttribute(page, '[id="Eräpäivä"]', 'value')
    if (!dueDate) throw new Error('Cannot find due date from form')

    await sendMaksatukset(page)
    await reloadPaymentPage(page)

    await gotoLähetetytMaksatuksetTab(page)
    const { "register-number": registerNumber } = await getHakemusTokenAndRegisterNumber(hakemusID)
    const pitkaviite = `${registerNumber}_1 Erkki Esimerkki`

    expect(await getBatchPitkäViite(page, 1)).toEqual(pitkaviite)
    expect(await getBatchStatus(page, 1)).toEqual("Lähetetty")
    expect(await getBatchToimittajanNimi(page, 1)).toEqual("Akaan kaupunki")
    expect(await getBatchHanke(page, 1)).toEqual("Rahassa kylpijät Ky Ay Oy")
    expect(await getBatchMaksuun(page, 1)).toEqual("99,999 €")
    expect(await getBatchIBAN(page, 1)).toEqual("FI95 6682 9530 0087 65")
    expect(await getBatchLKPTili(page, 1)).toEqual("82010000")
    expect(await getBatchTaKpTili(page, 1)).toEqual("29103020")
    expect(await getTiliönti(page, 1)).toEqual("99,999 €")


    await putMaksupalauteToMaksatuspalveluAndProcessIt(`
      <?xml version="1.0" encoding="UTF-8" standalone="no"?>
      <VA-invoice>
        <Header>
          <Pitkaviite>${pitkaviite}</Pitkaviite>
          <Maksupvm>2018-06-08</Maksupvm>
        </Header>
      </VA-invoice>
    `)

    await reloadPaymentPage(page)
    await gotoLähetetytMaksatuksetTab(page)
    expect(await getBatchStatus(page, 1)).toEqual("Maksettu")

    const maksatukset = await getAllMaksatuksetFromMaksatuspalvelu()
    expect(maksatukset).toContainEqual(getExpectedPaymentXML(project, operation, operationalUnit, pitkaviite, `${registerNumber}_1`, dueDate))
  })

async function fillTositepaivamaara(page: Page) {
  async function isFilledWithDateValue() {
    try {
      const inputValue = await getElementAttribute(page, '[id="Tositepäivämäärä"]', 'value')

      if (typeof inputValue !== 'string') return false

      return /[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(inputValue)
    } catch (e) {
      console.log('Failed to get tositepäivämäärä', e.message)
      return false
    }
  }

  while(! await isFilledWithDateValue()) {
    try {
      await page.click("#Tositepäivämäärä")
      await clickElementWithText(page, 'button', 'OK')
    } catch (e) {
      console.log('Failed to set tositepäivämäärä calendar date', e.message)
    }
  }
}

async function fillInMaksueranTiedot(page: Page, ashaTunniste: string, esittelijanOsoite: string, hyvaksyjanOsoite: string) {
  await fillTositepaivamaara(page)

  async function clearAndType(page: Page, selector: string, content: string) {
    let value = await page.$eval(selector, input => input.getAttribute("value"))
    while (value !== content) {
      await page.type(selector, content, { delay: 50 })
      value = await page.$eval(selector, input => input.getAttribute("value"))
    }
  }

  await clearAndType(page, "[data-test-id=maksatukset-asiakirja--asha-tunniste]", ashaTunniste)
  await clearAndType(page, "[data-test-id=maksatukset-asiakirja--esittelijan-sahkopostiosoite]", esittelijanOsoite)
  await clearAndType(page, "[data-test-id=maksatukset-asiakirja--hyvaksyjan-sahkopostiosoite]", hyvaksyjanOsoite)
  await page.click("button:not(disabled)[data-test-id=maksatukset-asiakirja--lisaa-asiakirja]")
}

function getUniqueFileName(): string {
  return `va_${new Date().getTime()}.xml`
}

async function putMaksupalauteToMaksatuspalveluAndProcessIt(xml: string): Promise<void> {
  await axios.post(`${VIRKAILIJA_URL}/api/test/process-maksupalaute`, {
    // The XML parser fails if the input doesn't start with "<?xml " hence the trimLeft
    xml: xml.trimLeft(),
    filename: getUniqueFileName()
  })
}

async function getAllMaksatuksetFromMaksatuspalvelu(): Promise<string[]> {
  const resp = await axios.get<{maksatukset: string[]}>(`${VIRKAILIJA_URL}/api/test/get-sent-maksatukset`)
  return resp.data.maksatukset
}

async function removeStoredPitkäviiteFromAllAvustushakuPayments(avustushakuId: number): Promise<void> {
  await axios.post(`${VIRKAILIJA_URL}/api/test/remove-stored-pitkaviite-from-all-avustushaku-payments`, { avustushakuId })
}

const getBatchStatus = getSentPaymentBatchColumn(2)
const getBatchPitkäViite = getSentPaymentBatchColumn(1)
const getBatchToimittajanNimi = getSentPaymentBatchColumn(3)
const getBatchHanke = getSentPaymentBatchColumn(4)
const getBatchMaksuun = getSentPaymentBatchColumn(5)
const getBatchIBAN = getSentPaymentBatchColumn(6)
const getBatchLKPTili = getSentPaymentBatchColumn(7)
const getBatchTaKpTili = getSentPaymentBatchColumn(8)
const getTiliönti = getSentPaymentBatchColumn(9)

async function gotoLähetetytMaksatuksetTab(page: Page): Promise<void> {
  await page.click('[data-test-id=sent-payments-tab]')
}

async function reloadPaymentPage(page: Page) {
  await Promise.all([
    waitForClojureScriptLoadingDialogVisible(page),
    page.reload({ waitUntil: 'load' }),
  ])
  await waitForClojureScriptLoadingDialogHidden(page)
}

function getSentPaymentBatchColumn(column: number) {
  return async (page: Page, paymentBatchRow: number): Promise<string | undefined> => {
    const rowSelector = (n: number) => `[data-test-id=sent-payment-batches-table] tbody > tr:nth-child(${n})`
    return await getElementInnerText(page, `${rowSelector(paymentBatchRow)} > td:nth-child(${column})`)
  }
}

function getExpectedPaymentXML(projekti: string, toiminto: string, toimintayksikko: string, pitkaviite: string, invoiceNumber: string, dueDate: string, ovt: string = '003727697901'): string {
  const today = moment(new Date()).format('YYYY-MM-DD')
  return `<?xml version="1.0" encoding="UTF-8"?><objects><object><header><toEdiID>${ovt}</toEdiID><invoiceType>INVOICE</invoiceType><vendorName>Akaan kaupunki</vendorName><addressFields><addressField1></addressField1><addressField2></addressField2><addressField5></addressField5></addressFields><vendorRegistrationId>2050864-5</vendorRegistrationId><bic>OKOYFIHH</bic><bankAccount>FI95 6682 9530 0087 65</bankAccount><invoiceNumber>${invoiceNumber}</invoiceNumber><longReference>${pitkaviite}</longReference><documentDate>${today}</documentDate><dueDate>${dueDate}</dueDate><paymentTerm>Z001</paymentTerm><currencyCode>EUR</currencyCode><grossAmount>99999</grossAmount><netamount>99999</netamount><vatamount>0</vatamount><voucherSeries>XE</voucherSeries><postingDate>${today}</postingDate><ownBankShortKeyCode></ownBankShortKeyCode><handler><verifierName>essi.esittelija@example.com</verifierName><verifierEmail>essi.esittelija@example.com</verifierEmail><approverName>hygge.hyvaksyja@example.com</approverName><approverEmail>hygge.hyvaksyja@example.com</approverEmail><verifyDate>${today}</verifyDate><approvedDate>${today}</approvedDate></handler><otsData><otsBankCountryKeyCode></otsBankCountryKeyCode></otsData><invoicesource>VA</invoicesource></header><postings><postingRows><postingRow><rowId>1</rowId><generalLedgerAccount>82010000</generalLedgerAccount><postingAmount>99999</postingAmount><accountingObject01>${toimintayksikko}</accountingObject01><accountingObject02>29103020</accountingObject02><accountingObject04>${projekti}</accountingObject04><accountingObject05>${toiminto}</accountingObject05><accountingObject08></accountingObject08></postingRow></postingRows></postings></object></objects>`
}

async function sendMaksatukset(page: Page): Promise<void> {
  const text = "Lähetetään maksatuksia"
  await Promise.all([
    waitForElementWithText(page, "span", text, "visible"),
    clickElementWithText(page, "button" , "Lähetä maksatukset"),
  ])
  await waitForElementWithText(page, "span", text, "hidden")
}
