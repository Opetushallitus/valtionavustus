import { Page } from "puppeteer";
import {
  fillMuutoshakemusBudgetAmount,
  getLinkToMuutoshakemusFromSentEmails,
  MuutoshakemusValues,
} from "./muutospaatosprosessi-util";
import {
  BudgetAmount,
  clearAndType,
  clickElement,
  setCalendarDate,
} from "../test-util";

export async function navigateToHakijaMuutoshakemusPage(
  page: Page,
  hakemusID: number
) {
  const linkToMuutoshakemus = await getLinkToMuutoshakemusFromSentEmails(
    hakemusID
  );
  await page.goto(linkToMuutoshakemus, { waitUntil: "networkidle0" });
}

export async function navigateToMuutoshakemusAndApplyForJatkoaikaAndBudgetChanges(
  page: Page,
  hakemusID: number,
  jatkoaika: MuutoshakemusValues,
  budjetti: BudgetAmount,
  budjettiPerustelut: string
) {
  await navigateToHakijaMuutoshakemusPage(page, hakemusID);
  await fillJatkoaikaValues(page, jatkoaika);
  await clickElement(page, "#checkbox-haenMuutostaTaloudenKayttosuunnitelmaan");
  await fillMuutoshakemusBudgetAmount(page, budjetti);
  await fillBudgetPerustelut(page, budjettiPerustelut);
  await clickSendMuutoshakemusButton(page);
  await page.waitForSelector(
    '[data-test-class="existing-muutoshakemus"][data-test-state="new"]'
  );
}

export async function fillJatkoaikaValues(
  page: Page,
  muutoshakemus: MuutoshakemusValues
) {
  if (!muutoshakemus.jatkoaika) throw new Error("Jatkoaika is required");

  await clickElement(page, "#checkbox-haenKayttoajanPidennysta");
  await clearAndType(
    page,
    "#perustelut-kayttoajanPidennysPerustelut",
    muutoshakemus.jatkoaikaPerustelu
  );
  await setCalendarDate(page, muutoshakemus.jatkoaika.format("DD.MM.YYYY"));
}

export async function clickSendMuutoshakemusButton(page: Page) {
  await clickElement(page, "#send-muutospyynto-button:not([disabled])");
}

export async function fillBudgetPerustelut(page: Page, perustelut: string) {
  await clearAndType(
    page,
    "#perustelut-taloudenKayttosuunnitelmanPerustelut",
    perustelut
  );
}
