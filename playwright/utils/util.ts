import moment from 'moment'
import { expect, Page } from '@playwright/test'

import { VIRKAILIJA_URL } from './constants'

export async function waitForNewTab(currentPage: Page): Promise<Page> {
  return new Promise((resolve) => currentPage.once('popup', (newPage) => resolve(newPage)))
}

export async function expectQueryParameter(page: Page, paramName: string): Promise<string> {
  const value = await page.evaluate(
    (param) => new URLSearchParams(window.location.search).get(param),
    paramName
  )
  if (!value)
    throw Error(`Expected page url '${page.url()}' to have query parameter '${paramName}'`)
  return value
}

type FakeIdentity = 'valtionavustus' | 'paivipaakayttaja' | 'viivivirkailija' | 'jotpakayttaja'
export async function switchUserIdentityTo(page: Page, identity: FakeIdentity): Promise<void> {
  await page.request.post(`${VIRKAILIJA_URL}/api/test/set-fake-identity/${identity}`)
  await page.reload()
}
export function expectToBeDefined<T>(val: T): asserts val is NonNullable<T> {
  expect(val).toBeDefined()
}

export function log(...args: any[]) {
  console.log(moment().format('YYYY-MM-DD HH:mm:ss.SSSS'), ...args)
}

export async function getExistingBudgetTableCells(page: Page, budgetRowSelector?: string) {
  const rowSelector = budgetRowSelector || '[data-test-id="meno-input-row"]'
  await expect(page.locator(rowSelector).nth(0)).toBeVisible()
  return await page.$$eval(rowSelector, (elements) => {
    return elements.map((elem) => ({
      description: elem.querySelector('.meno-description')?.textContent ?? '',
      amount: elem.querySelector('[data-test-id="current-value"]')?.textContent ?? '',
    }))
  })
}

export async function getChangedBudgetTableCells(page: Page, budgetRowSelector?: string) {
  const rowSelector = budgetRowSelector || '[data-test-id="meno-input-row"]'
  await expect(page.locator(rowSelector).nth(0)).toBeVisible()
  return await page.$$eval(rowSelector, (elements) => {
    return elements.map((elem) => ({
      description: elem.querySelector('.meno-description')?.textContent ?? '',
      amount: elem.querySelector('[data-test-id="muutoshakemus-value"]')?.textContent ?? '',
    }))
  })
}
