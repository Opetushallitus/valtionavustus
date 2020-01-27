const assert = require("assert")
const path = require("path")
const {randomBytes} = require("crypto")

const xlsx = require("xlsx")

const {
  describeBrowser,
  navigate,
  navigateHakija,
  HAKIJA_URL,
  VIRKAILIJA_URL
} = require("./TestUtil.js")

describeBrowser("VaSpec", function() {
  it("should allow basic avustushaku flow and check each hakemus has valmistelija", async function() {
    const {page} = this

    const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)

    await publishAvustushaku(page, avustushakuID)
    await fillAndSendHakemus(page, avustushakuID)

    await closeAvustushakuByChangingEndDateToPast(page, avustushakuID)

    // Accept the hakemus
    await navigate(page, `/avustushaku/${avustushakuID}/`)
    await Promise.all([
      page.waitForNavigation(),
      clickElementWithText(page, "td", "Akaan kaupunki"),
    ])

    const hakemusID = await page.evaluate(() => window.location.pathname.match(/\/hakemus\/(\d+)\//)[1])
    console.log("Hakemus ID:", hakemusID)

    await clickElement(page, "#arviointi-tab label[for='set-arvio-status-plausible']")
    await clearAndType(page, "#budget-edit-project-budget .amount-column input", "100000")
    await clickElement(page, "#arviointi-tab label[for='set-arvio-status-accepted']")
    await waitForArvioSave(page, avustushakuID, hakemusID)

    await resolveAvustushaku(page, avustushakuID)

    // Sending päätös should give error because the hakemus is missing valmistelija
    await sendPäätös(page, avustushakuID)
    assert.strictEqual(
      await textContent(page, "#päätös-send-error"),
      `Hakemukselle numero ${hakemusID} ei ole valittu valmistelijaa. Päätöksiä ei lähetetty.`
    )

    await selectValmistelijaForHakemus(page, avustushakuID, hakemusID, "_ valtionavustus")

    await sendPäätös(page, avustushakuID)
    const tapahtumaloki = await page.waitForSelector(".tapahtumaloki")
    const logEntryCount = await tapahtumaloki.evaluate(e => e.querySelectorAll(".entry").length)
    assert.strictEqual(logEntryCount, 1)
  })

  it("shows the same updated date on the Päätös tab as on the Väliselvitys and Loppuselvitys tabs", async function() {
    const {page} = this

    const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)

    await clickElementWithText(page, "span", "Päätös")
    const paatosUpdatedAt = textContent(page, "#paatosUpdatedAt")

    await clickElementWithText(page, "span", "Väliselvitys")
    const valiselvitysUpdatedAt = textContent(page, "#valiselvitysUpdatedAt")

    await clickElementWithText(page, "span", "Loppuselvitys")
    const loppuselvitysUpdatedAt = textContent(page, "#loppuselvitysUpdatedAt")

    return Promise.all([paatosUpdatedAt, valiselvitysUpdatedAt, loppuselvitysUpdatedAt])
      .then(([paatos, valiselvitys, loppuselvitys]) => {
        assert.equal(paatos, valiselvitys)
        assert.equal(paatos, loppuselvitys)
      })
  })

  it("updates only the update date on Päätös tab when päätös is modified", async function() {
    const {page} = this

    const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)
    await clickElementWithText(page, "span", "Päätös")

    await page.waitFor(70000)
    await clearAndType(page, "#decision\\.taustaa\\.fi", "Burger Time")
    await waitForSave(page, avustushakuID)

    const paatosUpdatedAt = textContent(page, "#paatosUpdatedAt")

    await clickElementWithText(page, "span", "Väliselvitys")
    const valiselvitysUpdatedAt = textContent(page, "#valiselvitysUpdatedAt")

    await clickElementWithText(page, "span", "Loppuselvitys")
    const loppuselvitysUpdatedAt = textContent(page, "#loppuselvitysUpdatedAt")

    return Promise.all([paatosUpdatedAt, valiselvitysUpdatedAt, loppuselvitysUpdatedAt])
      .then(([paatos, valiselvitys, loppuselvitys]) => {
        assert.equal(valiselvitys, loppuselvitys)
        assert.notEqual(paatos, valiselvitys)
      })
  })

  it("supports fields that accept only whole numbers", async function() {
    const {page} = this

    const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)
    const { fieldId, fieldLabel } = await addFieldToFormAndReturnElementIdAndLabel(page, avustushakuID, "integerField")

    await clickElementWithText(page, "span", "Haun tiedot")
    await publishAvustushaku(page, avustushakuID)

    await fillAndSendHakemus(page, avustushakuID, async () => {
      await typeValueInFieldAndExpectValidationError(page, fieldId, 'Not an integer', fieldLabel, 'fi: Syötä arvo kokonaislukuina')
      await typeValueInFieldAndExpectNoValidationError(page, fieldId, '420')
    })
  })

  it("produces väliselvitys sheet in excel export", async function() {
    const {page} = this

    const avustushakuID = await createValidCopyOfEsimerkkihakuAndReturnTheNewId(page)
    await publishAvustushaku(page, avustushakuID)
    await fillAndSendHakemus(page, avustushakuID)

    await closeAvustushakuByChangingEndDateToPast(page, avustushakuID)

    // Accept the hakemus
    await navigate(page, `/avustushaku/${avustushakuID}/`)
    await Promise.all([
      page.waitForNavigation(),
      clickElementWithText(page, "td", "Akaan kaupunki"),
    ])

    const hakemusID = await page.evaluate(() => window.location.pathname.match(/\/hakemus\/(\d+)\//)[1])
    console.log("Hakemus ID:", hakemusID)

    await clickElement(page, "#arviointi-tab label[for='set-arvio-status-plausible']")
    await clearAndType(page, "#budget-edit-project-budget .amount-column input", "100000")
    await clickElement(page, "#arviointi-tab label[for='set-arvio-status-accepted']")
    await waitForArvioSave(page, avustushakuID, hakemusID)

    await resolveAvustushaku(page, avustushakuID)

    await selectValmistelijaForHakemus(page, avustushakuID, hakemusID, "_ valtionavustus")

    await sendPäätös(page, avustushakuID)
    const tapahtumaloki = await page.waitForSelector(".tapahtumaloki")
    const logEntryCount = await tapahtumaloki.evaluate(e => e.querySelectorAll(".entry").length)
    assert.strictEqual(logEntryCount, 1)

    await gotoVäliselvitysTab(page, avustushakuID)
    await clickElementWithText(page, "button", "Lähetä väliselvityspyynnöt")
    const responseP = page.waitForResponse(`${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/selvitys/valiselvitys/send-notification`)
    await waitForElementWithText(page, "span", "Lähetetty 1 viestiä")
    const response = await (responseP.then(_ => _.json()))
    const väliselvitysKey = response.hakemukset[0].user_key
    console.log(`Väliselvitys user_key: ${väliselvitysKey}`)

    await fillAndSendVäliselvityspyyntö(page, avustushakuID, väliselvitysKey)

    const workbook = await downloadExcelExport(page, avustushakuID)

    assert.deepStrictEqual(workbook.SheetNames, [ "Hakemukset", "Hakemuksien vastaukset", "Väliselvityksien vastaukset", "Loppuselvityksien vastaukset", "Tiliöinti" ])
    const sheet = workbook.Sheets["Väliselvityksien vastaukset"]

    assert.strictEqual(sheet.B1.v, "Hakijaorganisaatio")
    assert.strictEqual(sheet.B2.v, "Akaan kaupungin kissojenkasvatuslaitos")

    assert.strictEqual(sheet.C1.v, "Hankkeen nimi")
    assert.strictEqual(sheet.C2.v, "Kissojen koulutuksen tehostaminen")
  })
})

async function resolveAvustushaku(page, avustushakuID) {
  await navigate(page, `/admin/haku-editor/?avustushaku=${avustushakuID}`)
  await clickElement(page, "label[for='set-status-resolved']")
  await waitForSave(page, avustushakuID)
}

async function closeAvustushakuByChangingEndDateToPast(page, avustushakuID) {
  await navigate(page, `/admin/haku-editor/?avustushaku=${avustushakuID}`)
  const previousYear = (new Date()).getFullYear() - 1
  await clearAndType(page, "#hakuaika-end", `1.1.${previousYear} 0.00`)
  await waitForSave(page, avustushakuID)
}

async function fillAndSendVäliselvityspyyntö(page, avustushakuID, väliselvitysKey) {
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

  await uploadFile(page, "[name='namedAttachment-0']", "./dummy.pdf")

  await submitVäliselvitys(page)
}

async function typeValueInFieldAndExpectValidationError(page, fieldId, value, fieldLabel, errorMessage) {
  const selector = '#' + fieldId
  const errorSummarySelector = 'a.validation-errors-summary'
  await clearAndType(page, selector, value)
  await page.waitForSelector(errorSummarySelector, { visible: true })
  assert.equal(await textContent(page, errorSummarySelector), '1 vastauksessa puutteita')
  await clickElement(page, errorSummarySelector)
  assert.equal(await textContent(page, '.validation-errors'), fieldLabel + errorMessage)
  await page.waitForSelector('#submit:disabled')
}

async function typeValueInFieldAndExpectNoValidationError(page, fieldId, value) {
  const selector = '#' + fieldId
  const errorSummarySelector = 'a.validation-errors-summary'
  await clearAndType(page, selector, '420')
  await page.waitForFunction(s => document.querySelector(s) == null, {}, errorSummarySelector)
  await page.waitForSelector('#submit:enabled')
}

async function addFieldToFormAndReturnElementIdAndLabel(page, avustushakuID, fieldType) {
  await clickElementWithText(page, "span", "Hakulomake")
  const jsonString = await textContent(page, ".form-json-editor textarea")
  const json = JSON.parse(jsonString)
  const content = json.content
  const fieldId = "fieldId" + randomString()
  const fieldLabel = "fieldLabel" + randomString()
  const field =  fieldJson(fieldType, fieldId, fieldLabel)

  const newJson = JSON.stringify(Object.assign({}, json, { content: content.concat(field) }))
  await clearAndSet(page, ".form-json-editor textarea", newJson)

  await Promise.all([
    page.waitForResponse(response => response.url() === `${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/form` && response.status() === 200),
    clickElementWithText(page, "button", "Tallenna")
  ])

  return { fieldId, fieldLabel }
}

function fieldJson(type, id, label) {
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
          "maxlength": 10
        },
        "required": true,
        "fieldType": type
      }
    ]}
}

async function publishAvustushaku(page, avustushakuID) {
  await clickElement(page, "label[for='set-status-published']")
  await waitForSave(page, avustushakuID)
}

async function fillAndSendHakemus(page, avustushakuID, beforeSubmitFn) {
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
  await uploadFile(page, "[name='previous-income-statement-and-balance-sheet']", "./dummy.pdf")
  await uploadFile(page, "[name='previous-financial-year-report']", "./dummy.pdf")
  await uploadFile(page, "[name='previous-financial-year-auditor-report']", "./dummy.pdf")
  await uploadFile(page, "[name='current-year-plan-for-action-and-budget']", "./dummy.pdf")
  await uploadFile(page, "[name='description-of-functional-development-during-last-five-years']", "./dummy.pdf")
  await uploadFile(page, "[name='financial-information-form']", "./dummy.pdf")

  if (beforeSubmitFn) {
    await beforeSubmitFn()
  }

  await page.waitForFunction(() => document.querySelector("#topbar #form-controls button#submit").disabled === false)
  await clickElement(page, "#topbar #form-controls button#submit")
  await page.waitForFunction(() => document.querySelector("#topbar #form-controls button#submit").textContent === "Hakemus lähetetty")
}

async function downloadExcelExport(page, avustushakuID) {
  await navigate(page, `/avustushaku/${avustushakuID}/`)

  // Hack around Puppeteer not being able to tell Puppeteer where to download files
  const url = `${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/export.xslx`
  const buffer = await downloadFile(page, url)
  return xlsx.read(buffer, {type: "buffer"})
}

// https://github.com/puppeteer/puppeteer/issues/299#issuecomment-569221074
async function downloadFile(page, resource, init) {
  const data = await page.evaluate(async (resource, init) => {
    const resp = await window.fetch(resource, init)
    if (!resp.ok)
      throw new Error(`Server responded with ${resp.status} ${resp.statusText}`)
    const data = await resp.blob()
    const reader = new FileReader()
    return new Promise(resolve => {
      reader.addEventListener("loadend", () => resolve({
        url: reader.result,
        mime: resp.headers.get('Content-Type'),
      }))
      reader.readAsDataURL(data)
    })
  }, resource, init)
  return Buffer.from(data.url.split(",")[1], "base64")
}

async function submitHakemus(page) {
  await page.waitForFunction(() => document.querySelector("#topbar #form-controls button#submit").disabled === false)
  await clickElement(page, "#topbar #form-controls button#submit")
  await page.waitForFunction(() => document.querySelector("#topbar #form-controls button#submit").textContent === "Hakemus lähetetty")
}

async function createValidCopyOfEsimerkkihakuAndReturnTheNewId(page) {
  const avustushakuName = mkAvustushakuName()
  console.log(`Avustushaku name for test: ${avustushakuName}`)

  await copyEsimerkkihaku(page)

  const avustushakuID = await page.evaluate(() => (new URLSearchParams(window.location.search)).get("avustushaku"))
  console.log(`Avustushaku ID: ${avustushakuID}`)

  await clearAndType(page, "#register-number", "230/2015")
  await clearAndType(page, "#haku-name-fi", avustushakuName)
  await clearAndType(page, "#hakuaika-start", "1.1.1970 0.00")
  const nextYear = (new Date()).getFullYear() + 1
  await clearAndType(page, "#hakuaika-end", `31.12.${nextYear} 23.59`)
  await waitForSave(page, avustushakuID)

  return avustushakuID
}

async function submitVäliselvitys(page) {
  await page.waitForFunction(() => document.querySelector("#topbar #form-controls button#submit").disabled === false)
  await clickElement(page, "#topbar #form-controls button#submit")
  await page.waitForFunction(() => document.querySelector("#topbar #form-controls button#submit").textContent === "Väliselvitys lähetetty")
}

async function selectValmistelijaForHakemus(page, avustushakuID, hakemusID, valmistelijaName) {
  await navigate(page, `/avustushaku/${avustushakuID}/`)
  await clickElement(page, `#hakemus-${hakemusID} .btn-role`)

  const xpath = `//table[contains(@class, 'hakemus-list')]/tbody//tr[contains(@class, 'selected')]//button[contains(., '${valmistelijaName}')]`
  const valmistelijaButton = await page.waitForXPath(xpath, {visible: true})

  await Promise.all([
    page.waitForResponse(`${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/hakemus/${hakemusID}/arvio`),
    valmistelijaButton.click(),
  ])
}

async function gotoVäliselvitysTab(page, avustushakuID) {
  await navigate(page, `/admin/valiselvitys/?avustushaku=${avustushakuID}`)
}

async function sendPäätös(page, avustushakuID) {
  await navigate(page, `/admin/decision/?avustushaku=${avustushakuID}`)
  await clickElementWithText(page, "button", "Lähetä 1 päätöstä")
  await Promise.all([
    page.waitForResponse(`${VIRKAILIJA_URL}/api/paatos/sendall/${avustushakuID}`),
    clickElementWithText(page, "button", "Vahvista lähetys"),
  ])
}

async function uploadFile(page, selector, filePath) {
  const element = await page.$(selector)
  await element.uploadFile(filePath)
}

async function waitForArvioSave(page, avustushakuID, hakemusID) {
  await page.waitForResponse(`${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/hakemus/${hakemusID}/arvio`)
}

async function waitForSave(page, avustushakuID) {
  await page.waitForFunction(() => document.querySelector("#form-controls .status .info").textContent === "Kaikki tiedot tallennettu")
}

async function clearAndType(page, selector, text) {
  const element = await page.waitForSelector(selector, {visible: true, timeout: 5 * 1000})
  await element.click()
  await page.evaluate(e => e.value = "", element)
  await page.keyboard.type(text)
  await page.evaluate(e => e.blur(), element)
}

async function clearAndSet(page, selector, text) {
  const element = await page.waitForSelector(selector, {visible: true, timeout: 5 * 1000})
  await page.evaluate((e, t) => e.value = t, element, text)
  await page.focus(selector);
  await page.keyboard.type(' ')
  await page.keyboard.press('Backspace')
}

async function clickElementWithText(page, elementType, text) {
  const element = await waitForElementWithText(page, elementType, text)
  assert.ok(element, `Could not find ${elementType} element with text '${text}'`)
  await element.click()
}

async function waitForElementWithText(page, elementType, text) {
  return await page.waitForXPath(`//${elementType}[contains(., '${text}')]`, {visible: true})
}

async function clickElement(page, selector) {
  const element = await page.waitForSelector(selector, {visible: true, timeout: 5 * 1000})
  await element.click()
}

async function textContent(page, selector) {
  const element = await page.waitForSelector(selector, {visible: true})
  return await page.evaluate(_ => _.textContent, element)
}

function mkAvustushakuName() {
  return "Testiavustushaku " + randomString()
}

async function copyEsimerkkihaku(page) {
  // Copy esimerkkihaku
  await navigate(page, "/admin/haku-editor/")
  await clickElement(page, ".haku-filter-remove")
  await clickElementWithText(page, "td", "Yleisavustus - esimerkkihaku")
  await clickElementWithText(page, "a", "Kopioi uuden pohjaksi")
  await page.waitFor(2000) // :|
}

function randomString() {
  return randomBytes(8).toString("hex")
}
