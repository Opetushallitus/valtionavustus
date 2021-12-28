import moment from "moment"
import {Page} from "@playwright/test"

import {
  clickElementWithText,
  waitForClojureScriptLoadingDialogHidden,
  waitForClojureScriptLoadingDialogVisible,
  clearAndType
} from '../utils/util'
import { navigate } from "../utils/navigate"

export function MaksatuksetPage (page: Page) {

  async function goto(avustushakuID?: number) {
    if (avustushakuID) {
      await navigate(page, `/admin-ui/payments/?grant-id=${avustushakuID}`)
    } else {
      await navigate(page, "/admin-ui/payments/")
    }
  }

  async function fillTositepaivamaara() {
    const isFilledWithDateValue = async () => {
      try {
        const inputValue = await page.getAttribute('[id="Tositepäivämäärä"]', 'value')

        if (typeof inputValue !== 'string') return false

        return /[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(inputValue)
      } catch (e) {
        console.log('Failed to get tositepäivämäärä', e)
        return false
      }
    }

    for (let tries = 0; tries < 3; tries++) {
      try {
        await page.click("#Tositepäivämäärä", { timeout: 5000 })
        await clickElementWithText(page, 'button', 'OK')
        if (await isFilledWithDateValue()) {
          break;
        }
      } catch (e) {
        console.log('Failed to set tositepäivämäärä calendar date', e)
      }
    }
  }

  async function fillInMaksueranTiedot(ashaTunniste: string, esittelijanOsoite: string, hyvaksyjanOsoite: string) {
    await fillTositepaivamaara()

    await clearAndType(page, "[data-test-id=maksatukset-asiakirja--asha-tunniste]", ashaTunniste)
    await clearAndType(page, "[data-test-id=maksatukset-asiakirja--esittelijan-sahkopostiosoite]", esittelijanOsoite)
    await clearAndType(page, "[data-test-id=maksatukset-asiakirja--hyvaksyjan-sahkopostiosoite]", hyvaksyjanOsoite)
    await page.click("button:not(disabled)[data-test-id=maksatukset-asiakirja--lisaa-asiakirja]")
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

  async function gotoLähetetytMaksatuksetTab(): Promise<void> {
    await page.click('[data-test-id=sent-payments-tab]')
  }

  async function reloadPaymentPage() {
    await Promise.all([
      waitForClojureScriptLoadingDialogVisible(page),
      page.reload({ waitUntil: 'load' }),
    ])
    await waitForClojureScriptLoadingDialogHidden(page)
  }

  function getSentPaymentBatchColumn(column: number) {
    return async (paymentBatchRow: number): Promise<string | undefined> => {
      const rowSelector = (n: number) => `[data-test-id=sent-payment-batches-table] tbody > tr:nth-child(${n})`
      return await page.innerText(`${rowSelector(paymentBatchRow)} > td:nth-child(${column})`)
    }
  }

  function getExpectedPaymentXML(projekti: string, toiminto: string, toimintayksikko: string, pitkaviite: string, invoiceNumber: string, dueDate: string, ovt: string = '003727697901'): string {
    const today = moment(new Date()).format('YYYY-MM-DD')
    return `<?xml version="1.0" encoding="UTF-8"?><objects><object><header><toEdiID>${ovt}</toEdiID><invoiceType>INVOICE</invoiceType><vendorName>Akaan kaupunki</vendorName><addressFields><addressField1></addressField1><addressField2></addressField2><addressField5></addressField5></addressFields><vendorRegistrationId>2050864-5</vendorRegistrationId><bic>OKOYFIHH</bic><bankAccount>FI95 6682 9530 0087 65</bankAccount><invoiceNumber>${invoiceNumber}</invoiceNumber><longReference>${pitkaviite}</longReference><documentDate>${today}</documentDate><dueDate>${dueDate}</dueDate><paymentTerm>Z001</paymentTerm><currencyCode>EUR</currencyCode><grossAmount>99999</grossAmount><netamount>99999</netamount><vatamount>0</vatamount><voucherSeries>XE</voucherSeries><postingDate>${today}</postingDate><ownBankShortKeyCode></ownBankShortKeyCode><handler><verifierName>essi.esittelija@example.com</verifierName><verifierEmail>essi.esittelija@example.com</verifierEmail><approverName>hygge.hyvaksyja@example.com</approverName><approverEmail>hygge.hyvaksyja@example.com</approverEmail><verifyDate>${today}</verifyDate><approvedDate>${today}</approvedDate></handler><otsData><otsBankCountryKeyCode></otsBankCountryKeyCode></otsData><invoicesource>VA</invoicesource></header><postings><postingRows><postingRow><rowId>1</rowId><generalLedgerAccount>82010000</generalLedgerAccount><postingAmount>99999</postingAmount><accountingObject01>${toimintayksikko}</accountingObject01><accountingObject02>29103020</accountingObject02><accountingObject04>${projekti}</accountingObject04><accountingObject05>${toiminto}</accountingObject05><accountingObject08></accountingObject08></postingRow></postingRows></postings></object></objects>`
  }

  async function sendMaksatukset(): Promise<void> {
    await Promise.all([
      page.waitForSelector(`text="Kaikki maksatukset lähetetty"`, { timeout: 10000 }),
      clickElementWithText(page, "button" , "Lähetä maksatukset"),
    ])
  }

  return {
    fillInMaksueranTiedot,
    getBatchHanke,
    getBatchIBAN,
    getBatchLKPTili,
    getBatchMaksuun,
    getBatchPitkäViite,
    getBatchStatus,
    getBatchTaKpTili,
    getBatchToimittajanNimi,
    getExpectedPaymentXML,
    getTiliönti,
    goto,
    gotoLähetetytMaksatuksetTab,
    reloadPaymentPage,
    sendMaksatukset,
  }
}
