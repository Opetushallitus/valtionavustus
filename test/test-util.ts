import * as xlsx from"xlsx"
import * as path from "path"
import * as yup from "yup"
import axios from "axios"
import { launch, Browser, Page } from "puppeteer"
import * as assert from "assert"
import * as fs from "fs"
import { Moment } from "moment"
const {randomBytes} = require("crypto")

const HAKIJA_HOSTNAME = process.env.HAKIJA_HOSTNAME || 'localhost'
const HAKIJA_PORT = 8080

const VIRKAILIJA_HOSTNAME = process.env.VIRKAILIJA_HOSTNAME || 'localhost'
const VIRKAILIJA_PORT = 8081

export const VIRKAILIJA_URL = `http://${VIRKAILIJA_HOSTNAME}:${VIRKAILIJA_PORT}`
export const HAKIJA_URL = `http://${HAKIJA_HOSTNAME}:${HAKIJA_PORT}`

export const dummyPdfPath = path.join(__dirname, 'dummy.pdf')
const hakulomakeJson = fs.readFileSync(path.join(__dirname, 'prod.hakulomake.json'), 'utf8')

interface Email {
  id: number
  "hakemus-id": number
  "created-at": Date
  "updated-at": Date
  formatted: string
}

interface Muutoshakemus {
  id: number
  "user-key": string
  "hakemus-version": number
  "haen-kayttoajan-pidennysta": boolean
  "kayttoajan-pidennys-perustelut": string
  "haettu-kayttoajan-paattymispaiva": string
  "created-at": Date
}

const emailSchema = yup.array().of(yup.object().shape<Email>({
  "id": yup.number().required(),
  "hakemus-id": yup.number().required(),
  "created-at": yup.date().required(),
  "updated-at": yup.date().required(),
  "formatted": yup.string().required()
}).required()).required()

export async function navigateToHakijaMuutoshakemusPage(page: Page, avustushakuID: number, hakemusID: string) {
  const emails = await getEmails(avustushakuID, hakemusID)
  const linkToMuutoshaku = emails[0].formatted.match(/https?:\/\/.*\/muutoshaku.*/)?.[0]
  expectToBeDefined(linkToMuutoshaku)
  await page.goto(linkToMuutoshaku, { waitUntil: "networkidle0" })
}

export async function getElementInnerText(page: Page, selector: string) {
    return await page.evaluate((s: string) => (document.querySelector(s) && document.querySelector(s) as HTMLElement)?.innerText, selector)
}

export async function getElementAttribute(page: Page, selector: string, attribute: string) {
    return await page.evaluate((s: string, a: string) =>
          (document.querySelector(s) && document.querySelector(s) as HTMLElement)?.getAttribute(a), selector, attribute)
}

export async function hasElementAttribute(page: Page, selector: string, attribute: string) {
    return await page.evaluate((s: string, a: string) =>
          (document.querySelector(s) && document.querySelector(s) as HTMLElement)?.hasAttribute(a), selector, attribute)
}

export const getEmails = (avustushakuID: number, hakemusID: string) =>
  axios.get(`${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/hakemus/${hakemusID}/email`)
    .then(r => emailSchema.validate(r.data))

export async function getUserKey(avustushakuID: number, hakemusID: string): Promise<string[]> {
  const response = await axios.get<Email[]>(`${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/hakemus/${hakemusID}/email`)
  return response.data.map(h => h['user-key'])
}

export async function getStoredMuutoshakemus(userKey: string): Promise<Muutoshakemus> {
  const response = await axios.get<Muutoshakemus>(`${HAKIJA_URL}/api/muutoshakemus/${userKey}`)
  return response.data
}

export function mkBrowser() {
  const headless = process.env['HEADLESS'] === 'true'
  return launch({
    args: headless ? ["--no-sandbox", "--disable-setuid-sandbox"] : [],
    slowMo: 0,
    headless: headless,
    timeout: 10_000,
    defaultViewport: { width: 1920, height: 1080 },
  })
}

export const getFirstPage = (browser: Browser) =>
  browser.pages().then(pages => pages[0])


export async function navigate(page: Page, path: string) {
  await page.goto(`${VIRKAILIJA_URL}${path}`, { waitUntil: "networkidle0" })
}

export async function navigateHakija(page: Page, path: string) {
  await page.goto(`${HAKIJA_URL}${path}`, { waitUntil: "networkidle0" })
}

export async function createMuutoshakemusEnabledEsimerkkihakuAndReturnId(page: Page, hakuName?: string, registerNumber?: string) {
  const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page, hakuName, registerNumber)

  await clickElementWithText(page, "span", "Hakulomake")
  await clearAndSet(page, ".form-json-editor textarea", hakulomakeJson)
  await clickFormSaveAndWait(page, avustushakuID)
  return avustushakuID
}

export async function createValidCopyOfEsimerkkihakuAndReturnTheNewId(page: Page, hakuName?: string, registerNumber?: string) {
  const avustushakuName = hakuName || mkAvustushakuName()
  console.log(`Avustushaku name for test: ${avustushakuName}`)

  await copyEsimerkkihaku(page)

  const avustushakuID = await page.evaluate(() => (new URLSearchParams(window.location.search)).get("avustushaku")).then(id => {
    expectToBeDefined(id)
    return parseInt(id)
  })
  console.log(`Avustushaku ID: ${avustushakuID}`)

  await clearAndType(page, "#register-number", registerNumber || "230/2015")
  await clearAndType(page, "#haku-name-fi", avustushakuName)
  await clearAndType(page, "#hakuaika-start", "1.1.1970 0.00")

  const nextYear = (new Date()).getFullYear() + 1
  await clearAndType(page, "#hakuaika-end", `31.12.${nextYear} 23.59`)
  await waitForSave(page)

  return avustushakuID
}

export async function publishAvustushaku(page: Page) {
  await clickElement(page, "label[for='set-status-published']")
  await waitForSave(page)
}

export async function fillAndSendHakemus(page: Page, avustushakuID: number, beforeSubmitFn?: () => void) {
  await navigateHakija(page, `/avustushaku/${avustushakuID}/`)

  await clearAndType(page, "#primary-email", "erkki.esimerkki@example.com")
  await clickElement(page, "#submit")

  await clearAndType(page, "#finnish-business-id", "2050864-5")
  await clickElement(page, "input.get-business-id")

  await clearAndType(page, "#applicant-name", "Erkki Esimerkki")
  await clearAndType(page, "#signature", "Erkki Esimerkki")
  await clearAndType(page, "#signature-email", "erkki.esimerkki@example.com")
  await clearAndType(page, "#bank-iban", "FI95 6682 9530 0087 65")
  await clearAndType(page, "#bank-bic", "OKOYFIHH")
  await clickElementWithText(page, "label", "Kansanopisto")

  await clearAndType(page, "[name='project-costs-row.amount']", "100000")
  await uploadFile(page, "[name='previous-income-statement-and-balance-sheet']", dummyPdfPath)
  await uploadFile(page, "[name='previous-financial-year-report']", dummyPdfPath)
  await uploadFile(page, "[name='previous-financial-year-auditor-report']", dummyPdfPath)
  await uploadFile(page, "[name='current-year-plan-for-action-and-budget']", dummyPdfPath)
  await uploadFile(page, "[name='description-of-functional-development-during-last-five-years']", dummyPdfPath)
  await uploadFile(page, "[name='financial-information-form']", dummyPdfPath)

  if (beforeSubmitFn) {
    await beforeSubmitFn()
  }

  await page.waitForFunction(() => (document.querySelector("#topbar #form-controls button#submit") as HTMLInputElement).disabled === false)
  await clickElement(page, "#topbar #form-controls button#submit")
  await page.waitForFunction(() => (document.querySelector("#topbar #form-controls button#submit") as HTMLInputElement).textContent === "Hakemus lähetetty")
}

export async function fillAndSendMuutoshakemusEnabledHakemus(page: Page, avustushakuID: number, answers: Answers, beforeSubmitFn?: () => void) {
  await navigateHakija(page, `/avustushaku/${avustushakuID}/`)

  await clearAndType(page, "#primary-email", answers.contactPersonEmail)
  await clickElement(page, "#submit:not([disabled])")

  await clearAndType(page, "#finnish-business-id", "2050864-5")
  await clickElement(page, "input.get-business-id")

  await clearAndType(page, "#applicant-name", answers.contactPersonName)
  await clearAndType(page, "[id='textField-0']", answers.contactPersonPhoneNumber)

  await clearAndType(page, "[id='signatories-fieldset-1.name']", "Erkki Esimerkki")
  await clearAndType(page, "[id='signatories-fieldset-1.email']", "erkki.esimerkki@example.com")

  await clickElementWithText(page, "label", "Kunta/kuntayhtymä, kunnan omistamat yhtiöt, kirkko")

  await clickElement(page, "[id='koodistoField-1_input']")
  await clickElementWithText(page, "li", "Kainuu")

  await clearAndType(page, "#bank-iban", "FI95 6682 9530 0087 65")
  await clearAndType(page, "#bank-bic", "OKOYFIHH")

  await clearAndType(page, "#textField-2", "2")
  await clearAndType(page, "#textField-1", "20")

  await clearAndType(page, "#project-name", answers.projectName)

  await clickElement(page, "[for='language.radio.0']")

  await clickElement(page, "[for='checkboxButton-0.checkbox.0']")

  await clickElementWithText(page, "label", "Opetuksen lisääminen")

  await clearAndType(page, "[id='project-description.project-description-1.goal']", "Tarvitsemme kuutio tonneittain rahaa jotta voimme kylpeä siinä.")

  await clearAndType(page, "[id='project-description.project-description-1.activity']", "Kylvemme rahassa ja rahoitamme rahapuita.")

  await clearAndType(page, "[id='project-description.project-description-1.result']", "Koko budjetti käytetään ja lisää aiotaan hakea.")

  await clearAndType(page, "[id='project-effectiveness']", "Hanke vaikuttaa ylempään ja keskikorkeaan johtoportaaseen.")

  await clearAndType(page, "[id='project-begin']", "13.03.1992")
  await clearAndType(page, "[id='project-end']", "13.03.2032")

  await clickElementWithText(page, "label", "Kyllä")

  await clearAndType(page, "[id='personnel-costs-row.description']", "Pieninä seteleinä kiitos.")
  await clearAndType(page, "[id='personnel-costs-row.amount']", "69420666")

  await clearAndType(page, "[id='self-financing-amount']", "1")

  if (beforeSubmitFn) {
    await beforeSubmitFn()
  }

  await page.waitForFunction(() => (document.querySelector("#topbar #form-controls button#submit") as HTMLInputElement).disabled === false)
  await clickElement(page, "#topbar #form-controls button#submit")
  await page.waitForFunction(() => (document.querySelector("#topbar #form-controls button#submit") as HTMLInputElement).textContent === "Hakemus lähetetty")
}

export async function uploadFile(page: Page, selector: string, filePath: string) {
  const element = await page.$(selector)
  await element?.uploadFile(filePath)
}

export async function closeAvustushakuByChangingEndDateToPast(page: Page, avustushakuID: number) {
  await navigate(page, `/admin/haku-editor/?avustushaku=${avustushakuID}`)
  const previousYear = (new Date()).getFullYear() - 1
  await clearAndType(page, "#hakuaika-end", `1.1.${previousYear} 0.00`)
  await waitForSave(page)
}


export function mkAvustushakuName() {
  return "Testiavustushaku " + randomString()
}

export function randomString() {
  return randomBytes(8).toString("hex")
}

export function expectToBeDefined<T>(val: T): asserts val is NonNullable<T> {
  if (val === undefined || val === null) {
    expect(val).toBeDefined();
  }
}

export async function copyEsimerkkihaku(page: Page) {
  // Copy esimerkkihaku
  await navigate(page, "/admin/haku-editor/")
  await clickElement(page, ".haku-filter-remove")
  await clickElementWithText(page, "td", "Yleisavustus - esimerkkihaku")
  await clickElementWithText(page, "a", "Kopioi uuden pohjaksi")
  await page.waitFor(2000) // :|
}

export async function clickElement(page: Page, selector: string) {
  const element = await page.waitForSelector(selector, {visible: true, timeout: 5 * 1000})
  await element.click()
}

export async function clickElementWithText(page: Page, elementType: string, text: string) {
  const element = await waitForElementWithText(page, elementType, text)
  assert.ok(element, `Could not find ${elementType} element with text '${text}'`)
  await element.click()
}

export async function waitForElementWithText(page: Page, elementType: string, text: string) {
  return await page.waitForXPath(`//${elementType}[contains(., '${text}')]`, {visible: true})
}

export async function clearAndType(page: Page, selector: string, text: string) {
  const element = await page.waitForSelector(selector, {visible: true, timeout: 5 * 1000})
  await element.click()
  await page.evaluate(e => e.value = "", element)
  await page.keyboard.type(text)
  await page.evaluate(e => e.blur(), element)
}

export async function waitForSave(page: Page) {
  await page.waitForFunction(() => document.querySelector("#form-controls .status .info")?.textContent === "Kaikki tiedot tallennettu")
}

export async function waitForArvioSave(page: Page, avustushakuID: number, hakemusID: number) {
  await page.waitForResponse(`${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/hakemus/${hakemusID}/arvio`)
}

export async function resolveAvustushaku(page: Page, avustushakuID: number) {
  await navigate(page, `/admin/haku-editor/?avustushaku=${avustushakuID}`)
  await clickElement(page, "label[for='set-status-resolved']")
  await waitForSave(page)
}

export async function sendPäätös(page: Page, avustushakuID: number) {
  await navigate(page, `/admin/decision/?avustushaku=${avustushakuID}`)
  await clickElementWithText(page, "button", "Lähetä 1 päätöstä")

  await Promise.all([
    page.waitForResponse(`${VIRKAILIJA_URL}/api/paatos/sendall/${avustushakuID}`),
    clickElementWithText(page, "button", "Vahvista lähetys"),
  ])
}

export async function textContent(page: Page, selector: string) {
  const element = await page.waitForSelector(selector, {visible: true})
  return await page.evaluate(_ => _.textContent, element)
}

export async function selectValmistelijaForHakemus(page: Page, avustushakuID: number, hakemusID: string, valmistelijaName: string) {
  await navigate(page, `/avustushaku/${avustushakuID}/`)
  await clickElement(page, `#hakemus-${hakemusID} .btn-role`)

  const xpath = `//table[contains(@class, 'hakemus-list')]/tbody//tr[contains(@class, 'selected')]//button[contains(., '${valmistelijaName}')]`
  const valmistelijaButton = await page.waitForXPath(xpath, {visible: true})

  await Promise.all([
    page.waitForResponse(`${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/hakemus/${hakemusID}/arvio`),
    valmistelijaButton.click(),
  ])
}

export async function deleteAttachment(page: Page, attachmentFieldId: string) {
  await clickElement(page, `#${attachmentFieldId} button.soresu-remove`)
  await page.waitForSelector(`[name='${attachmentFieldId}']`)
}

export async function verifyText(page: Page, selector: string, regex: RegExp) {
  await page.evaluate((selector) => document.querySelector(selector).scrollIntoView({block: 'center'}), selector)
  const element = await page.waitForSelector(selector, { visible: true })
  const text = await page.evaluate(element => element.textContent, element)
  assert.ok(regex.test(text), `Text ${regex.source} found from: ${text}`)
}

export async function verifyTooltipText(page: Page, tooltipAnchorSelector: string, tooltipTextRegex: RegExp) {
  const tooltipContentSelector = `${tooltipAnchorSelector} span`
  await page.evaluate((tooltipAnchorSelector) => {
    document.querySelector(tooltipAnchorSelector).scrollIntoView({ block: 'center' });
  }, tooltipAnchorSelector)

  await page.hover(tooltipAnchorSelector)
  const tooltipElement = await page.waitForSelector(tooltipContentSelector, { visible: true })
  const tooltipText = await page.evaluate(element => element.textContent, tooltipElement)
  assert.ok(tooltipTextRegex.test(tooltipText), `Tooltip ${tooltipTextRegex.source} found from: ${tooltipText}`)
}

export async function createValidCopyOfLukioEsimerkkihakuWithValintaperusteetAndReturnTheNewId(page: Page) {
  const avustushakuName = mkAvustushakuName()
  console.log(`Avustushaku name for test: ${avustushakuName}`)

  await copyEsimerkkihaku(page)

  const avustushakuID = await page.evaluate(() => (new URLSearchParams(window.location.search)).get("avustushaku"))

  expectToBeDefined(avustushakuID)

  console.log(`Avustushaku ID: ${avustushakuID}`)

  await clearAndType(page, "#register-number", "230/2015")
  await clearAndType(page, "#haku-name-fi", avustushakuName)
  await clearAndType(page, "#hakuaika-start", "1.1.1970 0.00")

  const lukioKoulutusasteSelector = '[name=education-levels][data-title="Lukiokoulutus"]'
  await clearAndType(page, lukioKoulutusasteSelector, "29.10.30")

  await clickElementWithText(page, "button", "Lisää uusi valintaperuste")
  await clearAndType(page, "#selection-criteria-0-fi", "Hanke edistää opetustuntikohtaisen valtionosuuden piiriin kuuluvan taiteen perusopetuksen pedagogista kehittämistä.")
  await clearAndType(page, "#selection-criteria-0-sv", "Och samma på svenska.")

  const nextYear = (new Date()).getFullYear() + 1
  await clearAndType(page, "#hakuaika-end", `31.12.${nextYear} 23.59`)
  await waitForSave(page)

  return parseInt(avustushakuID)
}

export async function gotoPäätösTab(page: Page, avustushakuID: number) {
  await navigate(page, `/admin/decision/?avustushaku=${avustushakuID}`)
}

export async function addFieldOfSpecificTypeToFormAndReturnElementIdAndLabel(page: Page, avustushakuID: number, fieldType: string) {
  const fieldId = "fieldId" + randomString()
  return addFieldToFormAndReturnElementIdAndLabel(page, avustushakuID, fieldId, fieldType)
}

export async function addFieldToFormAndReturnElementIdAndLabel(page: Page, avustushakuID: number, fieldId: string, fieldType: string) {
  const fields = [{fieldId: fieldId, fieldType: fieldType}]
  const augmentedFields = await addFieldsToFormAndReturnElementIdsAndLabels(page, avustushakuID, fields)
  return augmentedFields[0]
}

interface Field {
  fieldId: string
  fieldType: string
}

async function addFieldsToFormAndReturnElementIdsAndLabels(page: Page, avustushakuID: number, fields: Field[]) {
  await clickElementWithText(page, "span", "Hakulomake")
  const jsonString = await textContent(page, ".form-json-editor textarea")
  const json = JSON.parse(jsonString)
  const content = json.content

  const fieldsWithIdAndLabel = fields.map(({ fieldId, fieldType }) => ({
    fieldType: fieldType,
    fieldId: fieldId,
    fieldLabel: "fieldLabel" + randomString(),
  }))

  const fieldsJson = fieldsWithIdAndLabel.map(({ fieldType, fieldId, fieldLabel }) => fieldJson(fieldType, fieldId, fieldLabel))
  const newJson = JSON.stringify(Object.assign({}, json, { content: content.concat(fieldsJson) }))
  await clearAndSet(page, ".form-json-editor textarea", newJson)

  await clickFormSaveAndWait(page, avustushakuID)

  return fieldsWithIdAndLabel
}

function fieldJson(type: string, id: string, label: string) {
  return {
    "fieldClass": "wrapperElement",
    "id": id + 'wrapper',
    "fieldType": "theme",
    "children": [
      {
        "label": {
          "fi": label + "fi",
          "sv": label + "sv"
        },
        "fieldClass": "formField",
        "helpText": {
          "fi": "helpText fi",
          "sv": "helpText sv"
        },
        "id": id,
        "params": {
          "size": "small",
          "maxlength": 1000
        },
        "required": true,
        "fieldType": type
      }
    ]}
}

async function clearAndSet(page: Page, selector: string, text: string) {
  const element = await page.waitForSelector(selector, {visible: true, timeout: 5 * 1000})
  await page.evaluate((e, t) => e.value = t, element, text)
  await page.focus(selector);
  await page.keyboard.type(' ')
  await page.keyboard.press('Backspace')
}

export async function clickFormSaveAndWait(page: Page, avustushakuID: number) {
  await Promise.all([
    page.waitForResponse(response => response.url() === `${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/form` && response.status() === 200),
    clickElementWithText(page, "button", "Tallenna")
  ])
}

export async function typeValueInFieldAndExpectValidationError(page: Page, fieldId: string, value: string, fieldLabel: string, errorMessage: string) {
  const selector = '#' + fieldId
  const errorSummarySelector = 'a.validation-errors-summary'
  await clearAndType(page, selector, value)
  await page.waitForSelector(errorSummarySelector, { visible: true })
  assert.equal(await textContent(page, errorSummarySelector), '1 vastauksessa puutteita')
  await clickElement(page, errorSummarySelector)
  assert.equal(await textContent(page, '.validation-errors'), fieldLabel + errorMessage)
  await page.waitForSelector('#submit:disabled')
}

export async function typeValueInFieldAndExpectNoValidationError(page: Page, fieldId: string, value: string) {
  const selector = '#' + fieldId
  const errorSummarySelector = 'a.validation-errors-summary'
  await clearAndType(page, selector, value)
  await page.waitForFunction(s => document.querySelector(s) == null, {}, errorSummarySelector)
  await page.waitForSelector('#submit:enabled')
}

export async function gotoVäliselvitysTab(page: Page, avustushakuID: number) {
  await navigate(page, `/admin/valiselvitys/?avustushaku=${avustushakuID}`)
}

export async function fillAndSendVäliselvityspyyntö(page: Page, avustushakuID: number, väliselvitysKey: string) {
  await navigateHakija(page, `/avustushaku/${avustushakuID}/valiselvitys?hakemus=${väliselvitysKey}&lang=fi`)
  await clearAndType(page, "#organization", "Akaan kaupungin kissojenkasvatuslaitos")
  await clearAndType(page, "#project-name", "Kissojen koulutuksen tehostaminen")
  await clearAndType(page, "[name='project-description.project-description-1.goal']", "Kouluttaa kissoja entistä tehokkaamminen")
  await clearAndType(page, "[name='project-description.project-description-1.activity']", "Kissoille on tarjottu enemmän kissanminttua")
  await clearAndType(page, "[name='project-description.project-description-1.result']", "Ei tiedossa")

  await clearAndType(page, "[name='textArea-1']", "Miten hankeen toimintaa, tuloksia ja vaikutuksia on arvioitu?")
  await clearAndType(page, "[name='textArea-3']", "Miten hankkeesta/toiminnasta on tiedotettu?")

  await clickElementWithText(page, "label", "Toimintamalli")

  await clearAndType(page, "[name='project-outcomes.project-outcomes-1.description']", "Kuvaus")
  await clearAndType(page, "[name='project-outcomes.project-outcomes-1.address']", "Saatavuustiedot, www-osoite tms.")

  await clickElement(page, "label[for='radioButton-good-practices.radio.1']")
  await clearAndType(page, "[name='textArea-4']", "Lisätietoja")

  await uploadFile(page, "[name='namedAttachment-0']", dummyPdfPath)

  await submitVäliselvitys(page)
}

async function submitVäliselvitys(page: Page) {
  await page.waitForFunction(() => (document.querySelector("#topbar #form-controls button#submit") as HTMLInputElement).disabled === false)
  await clickElement(page, "#topbar #form-controls button#submit")
  await page.waitForFunction(() => (document.querySelector("#topbar #form-controls button#submit") as HTMLInputElement).textContent === "Väliselvitys lähetetty")
}

export async function downloadExcelExport(page: Page, avustushakuID: number) {
  await navigate(page, `/avustushaku/${avustushakuID}/`)

  // Hack around Puppeteer not being able to tell Puppeteer where to download files
  const url = `${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/export.xslx`
  const buffer = await downloadFile(page, url)
  return xlsx.read(buffer, {type: "buffer"})
}

// https://github.com/puppeteer/puppeteer/issues/299#issuecomment-569221074
async function downloadFile(page: Page, resource: string) {
  const data: any = await page.evaluate((resource, init) => {
    return window.fetch(resource, init)
      .then(resp => {
        if (!resp.ok)
          throw new Error(`Server responded with ${resp.status} ${resp.statusText}`)
        return resp.blob()
          .then( data => {
            const reader = new FileReader()
            return new Promise(resolve => {
              reader.addEventListener("loadend", () => resolve({
                url: reader.result,
                mime: resp.headers.get('Content-Type'),
              }))
              reader.readAsDataURL(data)
            })
          })
      })
  }, resource)
  return Buffer.from(data.url.split(",")[1], "base64")
}

export async function fillAndSendHakemusAndReturnHakemusId(page: Page, avustushakuID: number, beforeSubmitFn?: () => void) {
  let hakemusID

  async function fn() {
    const token = await page.evaluate(() => (new URLSearchParams(window.location.search)).get("hakemus"))
    const url = `${VIRKAILIJA_URL}/api/v2/external/hakemus/id/${token}`
    hakemusID = await axios.get(url).then(r => r.data.id)

    if (beforeSubmitFn)
      await beforeSubmitFn()
  }

  await fillAndSendHakemus(page, avustushakuID, fn)

  expectToBeDefined(hakemusID)
  return parseInt(hakemusID)
}

export async function navigateToHakemus(page: Page, avustushakuID: number, hakemusID: number) {
  await navigate(page, `/avustushaku/${avustushakuID}/`)
  await Promise.all([
    page.waitForNavigation(),
    clickElement(page, `#hakemus-${hakemusID}`)
  ])
}

export async function acceptHakemus(page: Page, avustushakuID: number, hakemusID: number, beforeSubmitFn: () => {}) {
  await navigate(page, `/avustushaku/${avustushakuID}/`)
  await Promise.all([
    page.waitForNavigation(),
    clickElementWithText(page, "td", "Akaan kaupunki"),
  ])

  await clickElement(page, "#arviointi-tab label[for='set-arvio-status-plausible']")
  await clearAndType(page, "#budget-edit-project-budget .amount-column input", "100000")
  await clickElement(page, "#arviointi-tab label[for='set-arvio-status-accepted']")
  await waitForArvioSave(page, avustushakuID, hakemusID)
  await beforeSubmitFn()
  await resolveAvustushaku(page, avustushakuID)
}

export async function clickElementWithTestId(page: Page, testId: string) {
  const element = await page.waitForSelector(`[data-test-id='${testId}']`, {visible: true, timeout: 5 * 1000})
  await element.click()
}

export async function expectedResponseFromExternalAPIhakemuksetForAvustushaku(avustushakuID: number, hakemusID: number, valueForNutshellField: string) {
  return [{
    'project-name': "",
    'project-begin': null,
    'organization-name': "Akaan kaupunki",
    'grant-id': avustushakuID,
    partners: null,
    'costs-granted' : 100000,
    'user-last-name': null,
    'language': "fi",
    id: hakemusID,
    nutshell: valueForNutshellField,
    'user-first-name': null,
    'budget-granted': 100000,
    'project-end': null
  }]
}

export async function actualResponseFromExternalAPIhakemuksetForAvustushaku(avustushakuID: number) {
  const url = `${VIRKAILIJA_URL}/api/v2/external/avustushaku/${avustushakuID}/hakemukset`
  return await axios.get(url).then(r => r.data)
}

export async function createUniqueCode(page: Page) {
  const uniqueCode = (new Date()).getTime()
  await clearAndType(page, '[data-test-id=code-form__year', '2020')
  await clearAndType(page, '[data-test-id=code-form__code', `${uniqueCode}`)
  await clearAndType(page, '[data-test-id=code-form__name', `Test code ${uniqueCode}`)
  await clickElementWithTestId(page, 'code-form__add-button')
  await page.waitForSelector(`tr[data-test-id="${uniqueCode}"]`)
  return uniqueCode
}

export async function assertCodeIsVisible(page: Page, code: number, visibility: boolean) {
  const buttonId = visibility ? 'code-row__hide-button' : 'code-row__show-button'
  const selector = `tr[data-test-id='${code}'] [data-test-id=${buttonId}]`
  await page.waitForSelector(selector)
}

export async function clickCodeVisibilityButton(page: Page, code: number, visibility: boolean) {
  const buttonId = visibility ? 'code-row__show-button' : 'code-row__hide-button'
  const selector = `tr[data-test-id='${code}'] [data-test-id=${buttonId}]`
  const element = await page.waitForSelector(selector, {visible: true, timeout: 5 * 1000})
  await element.click()
}

export interface MuutoshakemusValues {
  jatkoaika?: Moment,
  jatkoaikaPerustelu?: string
}

export async function fillAndSendMuutoshakemus(page: Page, avustushakuID: number, hakemusID: string, muutoshakemus: MuutoshakemusValues) {
  async function selectedDateHasBeenStoredToState(jatkoaika: Moment) {
    const selectedDateInStateSelector = `[class=paattymispaiva][data-test-value="${jatkoaika.format('DD.MM.YYYY')}"]`
    await page.waitForSelector(selectedDateInStateSelector, {visible: true, timeout: 5 * 1000})
  }

  async function waitForCalendarOpeningAnimationToComplete() {
    const calendarOpenedSelector = `[class*="rw-popup-container"]:not([class*="rw-popup-transition-entering"]`
    await page.waitForSelector(calendarOpenedSelector, {visible: true, timeout: 5 * 1000})
  }

  const { jatkoaika, jatkoaikaPerustelu } = muutoshakemus
  await navigateToHakijaMuutoshakemusPage(page, avustushakuID, hakemusID)
  if (jatkoaika) {
    const calendarDateSelector = `[title="${jatkoaika.format('LL')}"]`
    const calendarButtonSelector = `div[class="paattymispaiva"] button`
    await clickElement(page, '#checkbox-jatkoaika')
    await clearAndType(page, '#perustelut-jatkoaika', jatkoaikaPerustelu || '')
    await clickElement(page, calendarButtonSelector)
    await waitForCalendarOpeningAnimationToComplete()
    await clickElement(page, calendarDateSelector)
    await selectedDateHasBeenStoredToState(jatkoaika)
    await clickElement(page, '#send-muutospyynto-button')
  }

  const successNotificationSelector = 'div[class="auto-hide success"]'
  const notification = await textContent(page, successNotificationSelector)
  expect(notification).toBe('Muutokset tallennettu')
}

interface Answers {
  avustushakuName: string
  projectName: string
  contactPersonName: string
  contactPersonEmail: string
  contactPersonPhoneNumber: string
  registerNumber: string
}

export async function ratkaiseMuutoshakemusEnabledAvustushaku(page: Page, answers: Answers) {
  const avustushakuID = await createMuutoshakemusEnabledEsimerkkihakuAndReturnId(page, answers.avustushakuName, answers.registerNumber)
  await clickElementWithText(page, "span", "Haun tiedot")
  await publishAvustushaku(page)
  await fillAndSendMuutoshakemusEnabledHakemus(page, avustushakuID, answers)

  return await acceptAvustushaku(page, avustushakuID)
}

export async function ratkaiseAvustushaku(page: Page) {
  const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)
  await publishAvustushaku(page)
  await fillAndSendHakemus(page, avustushakuID)

  return await acceptAvustushaku(page, avustushakuID)
}

async function acceptAvustushaku(page: Page, avustushakuID: number) {
  await closeAvustushakuByChangingEndDateToPast(page, avustushakuID)

  // Accept the hakemus
  await navigate(page, `/avustushaku/${avustushakuID}/`)
  await Promise.all([
    page.waitForNavigation(),
    clickElementWithText(page, "td", "Akaan kaupunki"),
  ])

  const hakemusID = await page.evaluate(() => window.location.pathname.match(/\/hakemus\/(\d+)\//)?.[1])

  expectToBeDefined(hakemusID)
  console.log("Hakemus ID:", hakemusID)

  await clickElement(page, "#arviointi-tab label[for='set-arvio-status-plausible']")
  await clearAndType(page, "#budget-edit-project-budget .amount-column input", "100000")
  await clickElement(page, "#arviointi-tab label[for='set-arvio-status-accepted']")
  await waitForArvioSave(page, avustushakuID, parseInt(hakemusID))

  await resolveAvustushaku(page, avustushakuID)

  await selectValmistelijaForHakemus(page, avustushakuID, hakemusID, "_ valtionavustus")

  await sendPäätös(page, avustushakuID)
  const tapahtumaloki = await page.waitForSelector(".tapahtumaloki")
  const logEntryCount = await tapahtumaloki.evaluate(e => e.querySelectorAll(".entry").length)
  expect(logEntryCount).toEqual(1)
  return { avustushakuID, hakemusID}
}
