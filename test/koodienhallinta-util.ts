import { Page } from "puppeteer";
import { clickElement } from "./test-util";

type KoodienhallintaTab = "operational-unit" | "project" | "operation";

export async function clickKoodienhallintaTab(
  page: Page,
  tabName: KoodienhallintaTab
) {
  const tabSelector = `[data-test-id=code-value-tab-${tabName}]`;
  await clickElement(page, tabSelector);
  await page.waitForNetworkIdle();
  await page.waitForSelector(`.oph-tab-item-is-active${tabSelector}`, {
    visible: true,
  });
}
