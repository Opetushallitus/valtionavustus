const assert = require("assert")
const {randomBytes} = require("crypto")

const {
  describeBrowser,
  loginVirkailija,
  navigate,
  navigateHakija,
} = require("./TestUtil.js")

describeBrowser("VaSpec", function() {
  it("should allow basic avustushaku flow and check each hakemus has valmistelija", async function() {
    const {page} = this
    await loginVirkailija(page)

    const avustushakuName = mkAvustushakuName()
    console.log(`Avustushaku name for test: ${avustushakuName}`)

    // Copy esimerkkihaku
    await navigate(page, "/admin/haku-editor/")
    await clickElement(page, ".haku-filter-remove")
    await clickElementWithText(page, "td", "Yleisavustus - esimerkkihaku")
    await clickElementWithText(page, "a", "Kopioi uuden pohjaksi")
    await page.waitFor(2000) // :|

    const avustushakuID = await page.evaluate(() => (new URLSearchParams(window.location.search)).get("avustushaku"))
    console.log(`Avustushaku ID: ${avustushakuID}`)

    // Fill avustushaku and wait for it to save
    await clearAndType(page, "#register-number", "230/2015")
    await clearAndType(page, "#haku-name-fi", avustushakuName)
    await clearAndType(page, "#hakuaika-start", "1.1.1970 0.00")
    const nextYear = (new Date()).getFullYear() + 1
    await clearAndType(page, "#hakuaika-end", `31.12.${nextYear} 23.59`)
    await clickElementWithText(page, "label", "Julkaistu")
    await waitForSave(page, avustushakuID)

    // Fill and send hakemus
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
    await uploadFile(page, "[name='previous-financial-year-report']", "./dummy.pdf")
    await uploadFile(page, "[name='previous-financial-year-auditor-report']", "./dummy.pdf")
    await uploadFile(page, "[name='current-year-plan-for-action-and-budget']", "./dummy.pdf")
    await uploadFile(page, "[name='description-of-functional-development-during-last-five-years']", "./dummy.pdf")
    await uploadFile(page, "[name='financial-information-form']", "./dummy.pdf")

    await page.waitForFunction(() => document.querySelector("#topbar #form-controls button#submit").disabled === false)
    await clickElement(page, "#topbar #form-controls button#submit")
    await page.waitForFunction(() => document.querySelector("#topbar #form-controls button#submit").textContent === "Hakemus lähetetty")

    // Set hakuaika to past so the avustushaku closes
    await navigate(page, `/admin/haku-editor/?avustushaku=${avustushakuID}`)
    const previousYear = (new Date()).getFullYear() - 1
    await clearAndType(page, "#hakuaika-end", `1.1.${previousYear} 0.00`)
    await waitForSave(page, avustushakuID)

    // Accept the hakemus
    await navigate(page, `/avustushaku/${avustushakuID}/`)
    await Promise.all([
      page.waitForNavigation(),
      clickElementWithText(page, "td", "Akaan kaupunki"),
    ])

    const hakemusID = await page.evaluate(() => window.location.pathname.match(/\/hakemus\/(\d+)\//)[1])
    console.log("Hakemus ID:", hakemusID)

    await clickElementWithText(page, "label", "Käsittelyssä")
    await clearAndType(page, "#budget-edit-project-budget .amount-column input", "100000")
    await clickElementWithText(page, "label", "Hyväksytty")
    await waitForArvioSave(page, avustushakuID, hakemusID)

    // Set avustushaku state to ratkaistu
    await navigate(page, `/admin/haku-editor/?avustushaku=${avustushakuID}`)
    await clickElementWithText(page, "label", "Ratkaistu")
    await waitForSave(page, avustushakuID)

    // Sending päätös should give error because the hakemus is missing valmistelija
    await sendPäätös(page, avustushakuID)
    assert.strictEqual(
      await textContent(page, "#päätös-send-error"),
      `Virhe päätösten lähetyksessä: Hakemuksilta puuttuu valmistelija: ${hakemusID}`
    )

    // Set valmistelija and sending päätös should succeed
    await navigate(page, `/avustushaku/${avustushakuID}/`)
    await clickElement(page, `#hakemus-${hakemusID} .btn-role`)
    await Promise.all([
      page.waitForResponse(`http://localhost:8081/api/avustushaku/${avustushakuID}/hakemus/${hakemusID}/arvio`),
      clickElementWithText(page, "button", "_ valtionavustus"),
    ])

    await sendPäätös(page, avustushakuID)

    // Entry is added to tapahtumaloki for sent email
    const tapahtumaloki = await page.waitForSelector(".tapahtumaloki")
    const logEntryCount = await tapahtumaloki.evaluate(e => e.querySelectorAll(".entry").length)
    assert.strictEqual(logEntryCount, 1)
  })
})

async function sendPäätös(page, avustushakuID) {
  await navigate(page, `/admin/decision/?avustushaku=${avustushakuID}`)
  await clickElementWithText(page, "button", "Lähetä 1 päätöstä")
  await Promise.all([
    page.waitForResponse(`http://localhost:8081/api/paatos/sendall/${avustushakuID}`),
    clickElementWithText(page, "button", "Vahvista lähetys"),
  ])
}

async function uploadFile(page, selector, filePath) {
  const element = await page.$(selector)
  await element.uploadFile(filePath)
}

async function waitForArvioSave(page, avustushakuID, hakemusID) {
  await page.waitForResponse(`http://localhost:8081/api/avustushaku/${avustushakuID}/hakemus/${hakemusID}/arvio`)
}

async function waitForSave(page, avustushakuID) {
  await page.waitForResponse(`http://localhost:8081/api/avustushaku/${avustushakuID}`)
}

async function clearAndType(page, selector, text) {
  const element = await page.waitForSelector(selector, {visible: true, timeout: 5 * 1000})
  await element.click()
  await page.evaluate(e => e.value = "", element)
  await page.keyboard.type(text)
  await page.evaluate(e => e.blur(), element)
}

async function clickElementWithText(page, element, text) {
  const elements = await page.$x(`//${element}[contains(., '${text}')]`)
  assert.ok(elements.length > 0, `Could not find element with text '${text}'`)
  await elements[elements.length - 1].click()
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
  return "Testiavustushaku " + randomBytes(8).toString("hex")
}
