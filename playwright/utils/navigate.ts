import { Page } from "@playwright/test";

import { HAKIJA_URL, VIRKAILIJA_URL } from "./constants";

export async function navigate(page: Page, path: string) {
  return await page.goto(`${VIRKAILIJA_URL}${path}`);
}

export async function navigateHakija(page: Page, path: string) {
  return await page.goto(`${HAKIJA_URL}${path}`);
}
