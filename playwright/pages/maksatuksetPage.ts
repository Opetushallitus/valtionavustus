import moment from "moment"

import {Page} from "@playwright/test"

import {
  clickElementWithText,
  getElementAttribute,
  waitForClojureScriptLoadingDialogHidden,
  waitForClojureScriptLoadingDialogVisible,
  waitForElementWithText,
} from '../utils/util'

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

export async function fillInMaksueranTiedot(page: Page, ashaTunniste: string, esittelijanOsoite: string, hyvaksyjanOsoite: string) {
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

export const getBatchStatus = getSentPaymentBatchColumn(2)
export const getBatchPitkäViite = getSentPaymentBatchColumn(1)
export const getBatchToimittajanNimi = getSentPaymentBatchColumn(3)
export const getBatchHanke = getSentPaymentBatchColumn(4)
export const getBatchMaksuun = getSentPaymentBatchColumn(5)
export const getBatchIBAN = getSentPaymentBatchColumn(6)
export const getBatchLKPTili = getSentPaymentBatchColumn(7)
export const getBatchTaKpTili = getSentPaymentBatchColumn(8)
export const getTiliönti = getSentPaymentBatchColumn(9)

export async function gotoLähetetytMaksatuksetTab(page: Page): Promise<void> {
  await page.click('[data-test-id=sent-payments-tab]')
}

export async function reloadPaymentPage(page: Page) {
  await Promise.all([
    waitForClojureScriptLoadingDialogVisible(page),
    page.reload({ waitUntil: 'load' }),
  ])
  await waitForClojureScriptLoadingDialogHidden(page)
}

function getSentPaymentBatchColumn(column: number) {
  return async (page: Page, paymentBatchRow: number): Promise<string | undefined> => {
    const rowSelector = (n: number) => `[data-test-id=sent-payment-batches-table] tbody > tr:nth-child(${n})`
    return await page.innerText(`${rowSelector(paymentBatchRow)} > td:nth-child(${column})`)
  }
}

export function getExpectedPaymentXML(projekti: string, toiminto: string, toimintayksikko: string, pitkaviite: string, invoiceNumber: string, dueDate: string, ovt: string = '003727697901'): string {
  const today = moment(new Date()).format('YYYY-MM-DD')
  return `<?xml version="1.0" encoding="UTF-8"?><objects><object><header><toEdiID>${ovt}</toEdiID><invoiceType>INVOICE</invoiceType><vendorName>Akaan kaupunki</vendorName><addressFields><addressField1></addressField1><addressField2></addressField2><addressField5></addressField5></addressFields><vendorRegistrationId>2050864-5</vendorRegistrationId><bic>OKOYFIHH</bic><bankAccount>FI95 6682 9530 0087 65</bankAccount><invoiceNumber>${invoiceNumber}</invoiceNumber><longReference>${pitkaviite}</longReference><documentDate>${today}</documentDate><dueDate>${dueDate}</dueDate><paymentTerm>Z001</paymentTerm><currencyCode>EUR</currencyCode><grossAmount>99999</grossAmount><netamount>99999</netamount><vatamount>0</vatamount><voucherSeries>XE</voucherSeries><postingDate>${today}</postingDate><ownBankShortKeyCode></ownBankShortKeyCode><handler><verifierName>essi.esittelija@example.com</verifierName><verifierEmail>essi.esittelija@example.com</verifierEmail><approverName>hygge.hyvaksyja@example.com</approverName><approverEmail>hygge.hyvaksyja@example.com</approverEmail><verifyDate>${today}</verifyDate><approvedDate>${today}</approvedDate></handler><otsData><otsBankCountryKeyCode></otsBankCountryKeyCode></otsData><invoicesource>VA</invoicesource></header><postings><postingRows><postingRow><rowId>1</rowId><generalLedgerAccount>82010000</generalLedgerAccount><postingAmount>99999</postingAmount><accountingObject01>${toimintayksikko}</accountingObject01><accountingObject02>29103020</accountingObject02><accountingObject04>${projekti}</accountingObject04><accountingObject05>${toiminto}</accountingObject05><accountingObject08></accountingObject08></postingRow></postingRows></postings></object></objects>`
}

export async function sendMaksatukset(page: Page): Promise<void> {
  const text = "Lähetetään maksatuksia"
  await Promise.all([
    waitForElementWithText(page, "span", text, "visible"),
    clickElementWithText(page, "button" , "Lähetä maksatukset"),
  ])
  await waitForElementWithText(page, "span", text, "hidden")
}
