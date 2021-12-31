import moment from "moment";

import { VIRKAILIJA_URL } from "./constants"
import {Page} from "playwright";
import {expect} from "@playwright/test"

export async function clearAndType(page: Page, selector: string, content: string) {
  await page.fill(selector, "")
  await page.type(selector, content)
}

/** @deprecated use page.setInputFiles */
export async function uploadFile(page: Page, selector: string, filePath: string) {
  await page.setInputFiles(selector, filePath)
}

export async function waitForNewTab(currentPage: Page): Promise<Page> {
  return new Promise((resolve) => currentPage.once('popup', (newPage) => resolve(newPage)))
}

export async function expectQueryParameter(page: Page, paramName: string): Promise<string> {
  const value = await page.evaluate(param => (new URLSearchParams(window.location.search)).get(param), paramName)
  if (!value) throw Error(`Expected page url '${page.url()}' to have query parameter '${paramName}'`)
  return value
}

export async function getElementWithText(page: Page, elementType: string, text: string) {
  const selector = `${elementType}:has-text("${text}")`
  return await page.waitForSelector(selector)
}

export async function clickElementWithText(page: Page, elementType: string, text: string) {
  const selector = `${elementType}:has-text("${text}")`
  await page.click(selector)
}

/** @deprecated use page.getAttribute */
export async function getElementAttribute(page: Page, selector: string, attribute: string) {
  return await page.getAttribute(selector, attribute)
}

/** @deprecated use page.getAttribute !== null */
export async function hasElementAttribute(page: Page, selector: string, attribute: string) {
  const attributeValue = await getElementAttribute(page, selector, attribute) 
    return attributeValue !== null
}

/** @deprecated use page.innerText */
export async function getElementInnerText(page: Page, selector: string): Promise<string | undefined> {
  return await page.innerText(selector)
}

/** @deprecated use page.textContent */
export async function textContent(page: Page, selector: string) {
  return await page.textContent(selector)
}

/** @deprecated use page.isDisabled */
export async function isDisabled(page: Page, selector: string) {
  return await page.isDisabled(selector);
}

function waitForElementWithAttribute(page: Page, attribute: string, attributeValue: string, text: string) {
  return page.waitForSelector(`[${attribute}='${attributeValue}']:has-text("${text}")`, {timeout: 5000})
  // return await page.waitForXPath(`//*[@${attribute}='${attributeValue}'][contains(., '${text}')]`, waitForSelectorOptions)
}

type FakeIdentity = "valtionavustus" | "paivipaakayttaja" | "viivivirkailija"
export async function switchUserIdentityTo(page: Page, identity: FakeIdentity): Promise<void> {
  await page.request.post(`${VIRKAILIJA_URL}/api/test/set-fake-identity/${identity}`)
  await page.reload()
}

export async function waitForElementWithText(page: Page, elementType: string, text: string, state: "visible" | "hidden" = "visible" ) {
  return page.waitForSelector(`${elementType}:has-text("${text}")`, { state, timeout: 5000})
}

export function waitForDropdownElementWithText(page: Page, text: string) {
  return waitForElementWithAttribute(page, 'role', 'option', text)
}

export async function waitForClojureScriptLoadingDialogHidden(page: Page) {
  return page.waitForSelector("[data-test-id=loading-dialog]", { state: 'detached' })
}

export async function waitForClojureScriptLoadingDialogVisible(page: Page) {
  return page.waitForSelector("[data-test-id=loading-dialog]", { state: 'visible' })
}

export function expectToBeDefined<T>(val: T): asserts val is NonNullable<T> {
  expect(val).toBeDefined();
}

export function log(...args: any[]) {
  console.log(moment().format('YYYY-MM-DD HH:mm:ss.SSSS'), ...args)
}

export async function getExistingBudgetTableCells(page: Page, budgetRowSelector?:string) {
  const rowSelector = budgetRowSelector || '[data-test-id="meno-input-row"]'
  await page.waitForSelector(rowSelector)
  return await page.$$eval(rowSelector, elements => {
    return elements.map(elem => ({
      description: elem.querySelector('.meno-description')?.textContent ?? '',
      amount: elem.querySelector('[data-test-id="current-value"]')?.textContent ?? ''
    }))
  })
}

export async function getChangedBudgetTableCells(page: Page, budgetRowSelector?: string) {
  const rowSelector = budgetRowSelector || '[data-test-id="meno-input-row"]'
  await page.waitForSelector(rowSelector)
  return await page.$$eval(rowSelector, elements => {
    return elements.map(elem => ({
      description: elem.querySelector('.meno-description')?.textContent ?? '',
      amount: elem.querySelector('[data-test-id="muutoshakemus-value"]')?.textContent ?? ''
    }))
  })
}

export async function countElements(page: Page, selector: string) {
  return (await page.$$(selector)).length
}
