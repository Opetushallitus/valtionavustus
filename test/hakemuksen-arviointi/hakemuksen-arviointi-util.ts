import { Page } from "puppeteer"
import { clickElementWithText } from "../test-util"

export async function openPaatosPreview(page: Page) {
  await clickElementWithText(page, 'a', 'Esikatsele päätösdokumentti')
  await page.waitForSelector('.muutoshakemus-paatos__content')
}

export async function closePaatosPreview(page: Page) {
  await clickElementWithText(page, 'button', 'Sulje')
  await page.waitForSelector('.muutoshakemus-paatos__content', { hidden: true })
}
