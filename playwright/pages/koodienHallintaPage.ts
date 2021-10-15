import {Page} from "playwright";
import {
  VaCodeValues,
} from "../utils/util";
import {navigate} from "../utils/navigate";
import {randomString} from "../utils/random";

type KoodienhallintaTab = 'operational-unit' | 'project' | 'operation'

export class KoodienhallintaPage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page;
  }

  async navigate() {
    await navigate(this.page, '/admin-ui/va-code-values/')
  }

  async waitForClojureScriptLoadingDialogHidden() {
    await this.page.waitForSelector("[data-test-id=loading-dialog]", { state: 'detached' })
  }

  async clickKoodienhallintaTab(tabName: KoodienhallintaTab) {
    const tabSelector = `[data-test-id=code-value-tab-${tabName}]`
    await this.page.click(tabSelector)
    await this.waitForClojureScriptLoadingDialogHidden()
    await this.page.waitForSelector(`.oph-tab-item-is-active${tabSelector}`)
  }

  async createCode(name: string = 'Test code', code: string): Promise<string> {
    await this.page.fill('[data-test-id=code-form__year]', '2020')
    await this.page.fill('[data-test-id=code-form__code]', `${code}`)
    await this.page.fill('[data-test-id=code-form__name]', `${name} ${code}`)
    await this.page.click('[data-test-id=code-form__add-button]')
    await this.waitForClojureScriptLoadingDialogHidden()
    await this.page.waitForSelector(`tr[data-test-id="${code}"]`)
    return code
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
}
