import moment from "moment";
import { expect, Page } from "@playwright/test";

import { VIRKAILIJA_URL } from "./constants";

export function lastElementFromArray<T>(array: T[]): T {
  const lastElement = [...array].pop();
  if (!lastElement) {
    throw new Error(
      `Failed to get last element from array ${array.toString()}`
    );
  }

  return lastElement;
}

export async function clearAndType(
  page: Page,
  selector: string,
  content: string
) {
  await page.fill(selector, "");
  await page.type(selector, content);
}

export async function waitForNewTab(currentPage: Page): Promise<Page> {
  return new Promise((resolve) =>
    currentPage.once("popup", (newPage) => resolve(newPage))
  );
}

export async function expectQueryParameter(
  page: Page,
  paramName: string
): Promise<string> {
  const value = await page.evaluate(
    (param) => new URLSearchParams(window.location.search).get(param),
    paramName
  );
  if (!value)
    throw Error(
      `Expected page url '${page.url()}' to have query parameter '${paramName}'`
    );
  return value;
}

export async function clickElementWithTextStrict(
  page: Page,
  elementType: string,
  text: string
) {
  const selector = `${elementType}:text-is("${text}")`;
  await page.click(selector);
}

export async function clickElementWithText(
  page: Page,
  elementType: string,
  text: string
) {
  const selector = `${elementType}:has-text("${text}")`;
  await page.click(selector);
}

type FakeIdentity = "valtionavustus" | "paivipaakayttaja" | "viivivirkailija";
export async function switchUserIdentityTo(
  page: Page,
  identity: FakeIdentity
): Promise<void> {
  await page.request.post(
    `${VIRKAILIJA_URL}/api/test/set-fake-identity/${identity}`
  );
  await page.reload();
}

export async function waitForElementWithText(
  page: Page,
  elementType: string,
  text: string,
  state: "visible" | "hidden" = "visible"
) {
  return page.waitForSelector(`${elementType}:has-text("${text}")`, {
    state,
    timeout: 5000,
  });
}

export function expectToBeDefined<T>(val: T): asserts val is NonNullable<T> {
  expect(val).toBeDefined();
}

export function log(...args: any[]) {
  console.log(moment().format("YYYY-MM-DD HH:mm:ss.SSSS"), ...args);
}

export async function getExistingBudgetTableCells(
  page: Page,
  budgetRowSelector?: string
) {
  const rowSelector = budgetRowSelector || '[data-test-id="meno-input-row"]';
  await page.waitForSelector(rowSelector);
  return await page.$$eval(rowSelector, (elements) => {
    return elements.map((elem) => ({
      description: elem.querySelector(".meno-description")?.textContent ?? "",
      amount:
        elem.querySelector('[data-test-id="current-value"]')?.textContent ?? "",
    }));
  });
}

export async function getChangedBudgetTableCells(
  page: Page,
  budgetRowSelector?: string
) {
  const rowSelector = budgetRowSelector || '[data-test-id="meno-input-row"]';
  await page.waitForSelector(rowSelector);
  return await page.$$eval(rowSelector, (elements) => {
    return elements.map((elem) => ({
      description: elem.querySelector(".meno-description")?.textContent ?? "",
      amount:
        elem.querySelector('[data-test-id="muutoshakemus-value"]')
          ?.textContent ?? "",
    }));
  });
}

export async function countElements(page: Page, selector: string) {
  return (await page.$$(selector)).length;
}
