import { Page } from "puppeteer";
import {
  clickElement,
  waitForClojureScriptLoadingDialogHidden,
  waitForClojureScriptLoadingDialogVisible
} from "./test-util";

type KoodienhallintaTab = 'operational-unit' | 'project' | 'operation'

export async function clickKoodienhallintaTab(page: Page, tabName: KoodienhallintaTab) {
  const tabSelector = `[data-test-id=code-value-tab-${tabName}]`
  await Promise.all([
    clickElement(page, tabSelector),
    waitForClojureScriptLoadingDialogVisible(page)
  ])
  await waitForClojureScriptLoadingDialogHidden(page)
  await page.waitForSelector(`.oph-tab-item-is-active${tabSelector}`, {visible: true})
}
