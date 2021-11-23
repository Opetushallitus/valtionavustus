import {ElementHandle, Page} from "playwright";
import {expect} from "@playwright/test"
import moment from "moment";


export async function expectQueryParameter(page: Page, paramName: string): Promise<string> {
  const value = await page.evaluate(param => (new URLSearchParams(window.location.search)).get(param), paramName)
  if (!value) throw Error(`Expected page url '${page.url()}' to have query parameter '${paramName}'`)
  return value
}

export async function clickElementWithText(page: Page, elementType: string, text: string): Promise<ElementHandle> {
  const selector = `${elementType}:has-text("${text}")`
  const handle = await page.waitForSelector(selector)
  await handle.click()
  return handle
}

export async function getElementAttribute(page: Page, selector: string, attribute: string) {
  const handle = await page.waitForSelector(selector)
  return await handle.getAttribute(attribute)
}

function waitForElementWithAttribute(page: Page, attribute: string, attributeValue: string, text: string) {
  return page.waitForSelector(`[${attribute}='${attributeValue}']:has-text("${text}")`, {timeout: 5000})
  // return await page.waitForXPath(`//*[@${attribute}='${attributeValue}'][contains(., '${text}')]`, waitForSelectorOptions)
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
  const rowSelector = budgetRowSelector || '[data-test-id="meno-input-row"]'
  await page.waitForSelector(rowSelector)
  return await page.$$eval(rowSelector, elements => {
    return elements.map(elem => ({
      description: elem.querySelector('.meno-description')?.textContent ?? '',
      amount: elem.querySelector('[data-test-id="current-value"]')?.textContent ?? ''
    }))
  })
}

export async function getChangedBudgetTableCells(page: Page, budgetRowSelector?: string) {
  const rowSelector = budgetRowSelector || '[data-test-id="meno-input-row"]'
  await page.waitForSelector(rowSelector)
  return await page.$$eval(rowSelector, elements => {
    return elements.map(elem => ({
      description: elem.querySelector('.meno-description')?.textContent ?? '',
      amount: elem.querySelector('[data-test-id="muutoshakemus-value"]')?.textContent ?? ''
    }))
  })
}
