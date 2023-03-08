import moment from 'moment'
import { Page, expect } from '@playwright/test'

import { HakujenHallintaPage } from './hakujenHallintaPage'
import { navigate } from '../utils/navigate'

export function MaksatuksetPage(page: Page) {
  async function goto(avustushakuName: string) {
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    await hakujenHallintaPage.navigateToHakemusByClicking(avustushakuName)
    await page.locator('text=Maksatukset >> a').click()
    return maksatuksetTable(page)
  }

  async function gotoID(avustushakuID: number) {
    await navigate(page, `/admin/maksatukset/?avustushaku=${avustushakuID}`)
  }

  async function fillTositepaivamaara() {
    const openDatepicker = `[data-test-id="tosite-pvm"] button`
    const selectToday = `${openDatepicker} >> text=tänään`

    await page.locator(openDatepicker).click()
    await page.locator(selectToday).click()
  }

  async function getDueDateInputValue(): Promise<string> {
    const datePickerLocator = page.locator(`[data-test-id="eräpäivä"] input`)
    await expect(datePickerLocator).toHaveValue(/\d\d\.\d\d\.\d\d\d\d/)
    const dueDate = await datePickerLocator.inputValue()
    return moment(dueDate, 'DD.MM.YYYY').format('YYYY-MM-DD')
  }

  async function fillMaksueranTiedotAndSendMaksatukset() {
    const dueDate = await getDueDateInputValue()

    await fillInMaksueranTiedot(
      'asha pasha',
      'essi.esittelija@example.com',
      'hygge.hyvaksyja@example.com'
    )
    await sendMaksatukset()

    return dueDate
  }

  async function fillInMaksueranTiedot(
    ashaTunniste: string,
    esittelijanOsoite: string,
    hyvaksyjanOsoite: string
  ) {
    await page.waitForSelector(`.maksatukset_documents`)
    const amountOfInstallments = await page.locator(`.maksatukset_document-phase`).count()

    await fillTositepaivamaara()

    for (let i = 0; i < amountOfInstallments; i++) {
      const row = page.locator(`.maksatukset_document`).nth(i)
      await row.locator('input').nth(0).fill(ashaTunniste)
      await row.locator('input').nth(1).fill(esittelijanOsoite)
      await row.locator('input').nth(2).fill(hyvaksyjanOsoite)
      await row.locator('text=Lisää asiakirja').click()
    }
  }

  async function reloadPaymentPage() {
    await page.reload({ waitUntil: 'networkidle' })
  }

  function getExpectedPaymentXML({
    projekti,
    toiminto,
    toimintayksikko,
    pitkaviite,
    invoiceNumber,
    dueDate,
    ovt = '003727697901',
    talousarviotili,
  }: {
    projekti: string
    toiminto: string
    toimintayksikko: string
    pitkaviite: string
    invoiceNumber: string
    dueDate: string
    ovt?: string
    talousarviotili: string
  }): string {
    const today = moment(new Date()).format('YYYY-MM-DD')
    return `<?xml version="1.0" encoding="UTF-8"?><objects><object><header><toEdiID>${ovt}</toEdiID><invoiceType>INVOICE</invoiceType><vendorName>Akaan kaupunki</vendorName><addressFields><addressField1></addressField1><addressField2></addressField2><addressField5></addressField5></addressFields><vendorRegistrationId>2050864-5</vendorRegistrationId><bic>OKOYFIHH</bic><bankAccount>FI95 6682 9530 0087 65</bankAccount><invoiceNumber>${invoiceNumber}</invoiceNumber><longReference>${pitkaviite}</longReference><documentDate>${today}</documentDate><dueDate>${dueDate}</dueDate><paymentTerm>Z001</paymentTerm><currencyCode>EUR</currencyCode><grossAmount>99999</grossAmount><netamount>99999</netamount><vatamount>0</vatamount><voucherSeries>XE</voucherSeries><postingDate>${today}</postingDate><ownBankShortKeyCode></ownBankShortKeyCode><handler><verifierName>essi.esittelija@example.com</verifierName><verifierEmail>essi.esittelija@example.com</verifierEmail><approverName>hygge.hyvaksyja@example.com</approverName><approverEmail>hygge.hyvaksyja@example.com</approverEmail><verifyDate>${today}</verifyDate><approvedDate>${today}</approvedDate></handler><otsData><otsBankCountryKeyCode></otsBankCountryKeyCode></otsData><invoicesource>VA</invoicesource></header><postings><postingRows><postingRow><rowId>1</rowId><generalLedgerAccount>82010000</generalLedgerAccount><postingAmount>99999</postingAmount><accountingObject01>${toimintayksikko}</accountingObject01><accountingObject02>${talousarviotili}</accountingObject02><accountingObject04>${projekti}</accountingObject04><accountingObject05>${toiminto}</accountingObject05><accountingObject08></accountingObject08></postingRow></postingRows></postings></object></objects>`
  }

  async function sendMaksatukset(): Promise<void> {
    const lahetetytTab = page.locator('a').locator('text=Lähetetyt maksatukset')
    await expect(lahetetytTab).not.toContainText('uutta')
    const sendBtn = page.locator('text=Lähetä maksatukset ja täsmäytysraportti')
    await sendBtn.click()
    await expect(sendBtn).toBeDisabled()
    await expect(page.locator('text=Lähetetään maksatuksia ja täsmäytysraporttia')).toBeVisible()
    await expect(lahetetytTab).toContainText('uutta', { timeout: 10000 })
  }

  async function clickLahetetytMaksatuksetTab() {
    await page.locator(`text=Lähetetyt maksatukset`).click()
    return lahetetytMaksueratTab(page)
  }

  return {
    fillInMaksueranTiedot,
    fillMaksueranTiedotAndSendMaksatukset,
    getExpectedPaymentXML,
    goto,
    gotoID,
    reloadPaymentPage,
    sendMaksatukset,
    clickLahetetytMaksatuksetTab,
    page,
    luoMaksatukset: page.locator('text=Luo maksatukset'),
    maksatuksetTableRow: (nth: number) => maksatuksetTable(page, nth),
  }
}

function maksatuksetTable(page: Page, tableRowIndex = 0) {
  return {
    pitkaviite: page.locator('data-test-id=pitkaviite').nth(tableRowIndex),
    paymentStatus: page.locator('data-test-id=payment-status').nth(tableRowIndex),
    toimittaja: page.locator('data-test-id=toimittaja').nth(tableRowIndex),
    hanke: page.locator('data-test-id=hanke').nth(tableRowIndex),
    projektikoodi: page.locator('data-test-id=project-code').nth(tableRowIndex),
    maksuun: page.locator('data-test-id=maksuun').nth(tableRowIndex),
    iban: page.locator('data-test-id=iban').nth(tableRowIndex),
    lkpTili: page.locator('data-test-id=lkp-tili').nth(tableRowIndex),
    takpTili: page.locator('data-test-id=takp-tili').nth(tableRowIndex),
    tiliointi: page.locator('data-test-id=tiliointi').nth(tableRowIndex),
  }
}

function lahetetytMaksueratTab(page: Page) {
  return function maksuerat(phase: 1 | 2 | 3) {
    const tableSelector = `[data-test-id="maksatukset-table-batches"] tbody tr:nth-of-type(${phase})`
    const tableRowIndex = phase - 1
    const tableTdLocator = page.locator(`${tableSelector} td`)
    return {
      ...maksatuksetTable(page, tableRowIndex),
      phaseTitle: tableTdLocator.nth(0),
      totalSum: tableTdLocator.nth(1),
      amountOfPayments: tableTdLocator.nth(2),
      laskuPaivamaara: tableTdLocator.nth(3),
      eraPaivamaara: tableTdLocator.nth(4),
      tositePaiva: tableTdLocator.nth(5),
      allekirjoitettuYhteenveto: tableTdLocator.nth(6),
      presenterEmail: tableTdLocator.nth(7),
      acceptorEmail: tableTdLocator.nth(8),
    }
  }
}
