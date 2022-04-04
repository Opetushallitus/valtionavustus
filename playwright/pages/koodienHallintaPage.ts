import {Page, Locator, expect} from "@playwright/test";
import {navigate} from "../utils/navigate";
import {randomString} from "../utils/random";
import {VaCodeValues} from "../utils/types";
import {HakujenHallintaPage} from "./hakujenHallintaPage";

type KoodienhallintaTab = 'operational-unit' | 'project' | 'operation'

export class KoodienhallintaPage {
  readonly page: Page
  readonly yearInput: Locator
  readonly nameInput: Locator
  readonly codeInput: Locator
  readonly submitButton: Locator
  readonly codeInputError: Locator
  readonly codeList: Locator

  constructor(page: Page) {
    this.page = page;
    this.yearInput = this.page.locator('[data-test-id=code-form__year]')
    this.nameInput = this.page.locator('[data-test-id=code-form__name]')
    this.codeInput = this.page.locator('[data-test-id=code-form__code]')
    this.submitButton = this.page.locator('[data-test-id=code-form__add-button]')
    this.codeInputError = this.page.locator('.code-input-error')
    this.codeList = this.page.locator('table tbody')
  }


  async navigate() {
    await navigate(this.page, '/admin-ui/va-code-values/')
  }

  async navigateToHakujenHallintaPage() {
    await navigate(this.page, '/admin/haku-editor/')
    await this.page.waitForLoadState('networkidle')
    return new HakujenHallintaPage(this.page)
  }

  async clickKoodienhallintaTab(tabName: KoodienhallintaTab) {
    const tabSelector = `[data-test-id=code-value-tab-${tabName}]`
    await this.page.click(tabSelector)
    await this.page.waitForSelector(`.oph-tab-item-is-active${tabSelector}`)
  }

  async clickCodeVisibilityButton(year: string, name: string, code: string, visibility: boolean) {
    const buttonId = visibility ? 'show-code' : 'hide-code'
    await this.codeRowLocator(year, name, code).locator(`[data-test-id=${buttonId}]`).click()
    await this.page.waitForLoadState('networkidle')
  }

  /*
    sometimes the value gets filled but the value isnt in the dom
   */
  async makeSureCodeFilled(selector: string, value: string) {
    const isNotFilled = async (): Promise<boolean> => {
      const currentValue = await this.page.locator(selector).inputValue()
      return currentValue !== value
    }
    let count = 0
    while (await isNotFilled()) {
      count++
      if (count > 10) {
        throw Error(`Failed to fill ${selector} with ${value}`)
      }
      await this.page.fill(selector, value)
    }
  }

  async createCode(name: string = 'Test code', code: string): Promise<string> {
    const year = '2020'
    await this.makeSureCodeFilled('[data-test-id=code-form__year]', year)
    await this.makeSureCodeFilled('[data-test-id=code-form__code]', `${code}`)
    await this.makeSureCodeFilled('[data-test-id=code-form__name]', `${name} ${code}`)
    await this.submitButton.click()
    await this.codeRowLocator(year, `${name} ${code}`, code).waitFor()
    return code
  }

  codeRowLocator(year: string, name: string, code: string) {
    return this.page.locator(`tr[data-test-id="code-cell-${year}-${code}-${name}"]`)
  }

  firstCellLocator(year: string, name: string, code: string) {
    return this.codeRowLocator(year, name, code).locator('td:first-of-type')
  }

  async assertCodeIsVisible(year: string, name: string, code: string) {
    await expect(this.firstCellLocator(year, name, code)).not.toHaveClass('code-cell__hidden')
  }

  async assertCodeIsHidden(year: string, name: string, code: string) {
    await expect(this.firstCellLocator(year, name, code)).toHaveClass('code-cell__hidden')
  }

  async createCodeValues(codeValues: VaCodeValues): Promise<VaCodeValues> {
    await this.navigate()
    await this.createCode("Toimintayksikkö", codeValues.operationalUnit)
    await this.clickKoodienhallintaTab( 'project')
    await this.createCode("Projekti", codeValues.project)
    await this.clickKoodienhallintaTab('operation')
    await this.createCode("Toiminto", codeValues.operation)
    return codeValues
  }

  async createRandomCodeValues(): Promise<VaCodeValues> {
    const uniqueCode = () => randomString().substring(0, 13)
    const codeValues = { operationalUnit: uniqueCode(), project: uniqueCode(), operation: uniqueCode() }
    return this.createCodeValues(codeValues)
  }

  async codeInputFormHasError(errorText: string) {
    await this.codeInputError.locator(`text="${errorText}"`)
  }

  async noCodeInputFormErrors() {
    await this.codeInputError.waitFor({state: 'detached'})
  }
}
