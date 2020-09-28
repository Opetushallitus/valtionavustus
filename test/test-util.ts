import { launch, Browser, Page } from "puppeteer"
import * as assert from "assert"
const {randomBytes} = require("crypto")

const HAKIJA_HOSTNAME = process.env.HAKIJA_HOSTNAME || 'localhost'
const HAKIJA_PORT = 8080

const VIRKAILIJA_HOSTNAME = process.env.VIRKAILIJA_HOSTNAME || 'localhost'
const VIRKAILIJA_PORT = 8081

const VIRKAILIJA_URL = `http://${VIRKAILIJA_HOSTNAME}:${VIRKAILIJA_PORT}`
const HAKIJA_URL = `http://${HAKIJA_HOSTNAME}:${HAKIJA_PORT}`

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

export async function createValidCopyOfEsimerkkihakuAndReturnTheNewId(page: Page) {
  const avustushakuName = mkAvustushakuName()
  console.log(`Avustushaku name for test: ${avustushakuName}`)

  await copyEsimerkkihaku(page)

  const avustushakuID = await page.evaluate(() => (new URLSearchParams(window.location.search)).get("avustushaku"))
  console.log(`Avustushaku ID: ${avustushakuID}`)
  expectToBeDefined(avustushakuID)

  await clearAndType(page, "#register-number", "230/2015")
  await clearAndType(page, "#haku-name-fi", avustushakuName)
  await clearAndType(page, "#hakuaika-start", "1.1.1970 0.00")

  const nextYear = (new Date()).getFullYear() + 1
  await clearAndType(page, "#hakuaika-end", `31.12.${nextYear} 23.59`)
  await waitForSave(page)

  return parseInt(avustushakuID)
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

