import { Page } from "puppeteer";
import { waitForClojureScriptLoadingDialogHidden } from "./test-util";

type KoodienhallintaTab = 'operational-unit' | 'project' | 'operation'

export async function clickKoodienhallintaTab(page: Page, tabName: KoodienhallintaTab) {
  const tabSelector = `[data-test-id=code-value-tab-${tabName}]`
  await page.click(tabSelector)
  await page.waitForSelector(`.oph-tab-item-is-active${tabSelector}`)
  await waitForClojureScriptLoadingDialogHidden(page)
}
