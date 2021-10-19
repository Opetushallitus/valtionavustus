import {Page} from "playwright";
import {HAKIJA_URL, VIRKAILIJA_URL} from "./constants";
import {getHakemusUrlFromEmail, pollUntilNewHakemusEmailArrives} from "./emails";
import {expectToBeDefined} from "./util";

export async function navigate(page: Page, path: string) {
    await page.goto(`${VIRKAILIJA_URL}${path}`)
}

export async function navigateHakija(page: Page, path: string) {
    await page.goto(`${HAKIJA_URL}${path}`)
}

export async function navigateToNewHakemusPage(page: Page, avustushakuID: number) {
    const receivedEmail = await pollUntilNewHakemusEmailArrives(avustushakuID)
    const hakemusUrl = getHakemusUrlFromEmail(receivedEmail[0])
    expectToBeDefined(hakemusUrl)

    await page.goto(hakemusUrl)
}
