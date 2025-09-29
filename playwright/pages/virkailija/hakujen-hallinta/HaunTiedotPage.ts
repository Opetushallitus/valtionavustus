import { expect, Page } from '@playwright/test'
import { createReactSelectLocators } from '../../../utils/react-select'
import { CommonHakujenHallintaPage, saveStatusTestId } from './CommonHakujenHallintaPage'
import moment from 'moment/moment'
import { NoProjectCodeProvided, VaCodeValues } from '../../../utils/types'

const dateFormat = 'D.M.YYYY H.mm'
const formatDate = (date: Date | moment.Moment) => moment(date).format(dateFormat)

export const HaunTiedotPage = (page: Page) => {
  const common = CommonHakujenHallintaPage(page)
  const locators = {
    hakuName: {
      fi: page.locator('#haku-name-fi'),
      sv: page.locator('#haku-name-sv'),
    },
    addProject: page.locator('.lisaa-projekti'),
    removeProject: (code: string) =>
      page.getByTestId(`projekti-valitsin-${code}`).locator('.poista-projekti'),
    selectProject: page.locator('.projekti-valitsin input'),
    selectProjectWithCode: (code: string) =>
      page.getByTestId(`projekti-valitsin-${code}`).locator('input'),
    dropdownForCode: (codeType: 'operational-unit' | 'project' | 'operation') =>
      page.getByTestId(`code-value-dropdown__${codeType}`),
    hakuAika: {
      start: page.locator('#hakuaika-start'),
      end: page.locator('#hakuaika-end'),
    },
    puutteita: page.locator('text=Jossain kentässä puutteita. Tarkasta arvot.'),
    status: {
      draft: page.locator("label[for='set-status-draft']"),
      published: page.locator("label[for='set-status-published']"),
      resolved: page.locator("label[for='set-status-resolved']"),
    },
    registerNumber: page.locator('#register-number'),
    hallinoiavustuksiaRegisterNumber: page.getByPlaceholder('Esim. va-oph-2023-6'),
    hakuRole: {
      vastuuvalmistelija: {
        name: page.getByTestId('vastuuvalmistelija-name'),
        email: page.getByTestId('vastuuvalmistelija-email'),
      },
      roleRow: (name: string) => {
        const testId = 'role-' + name.toLowerCase().replace(' ', '-')
        const row = page.getByTestId(testId)
        return {
          row,
          removeButton: row.locator('button'),
          select: row.locator('select[name=role]'),
          nameInput: row.locator('input[name=name]'),
          emailInput: row.locator('input[name=email]'),
        }
      },
      searchInput: page.locator('#va-user-search-input'),
      clearSearch: page.getByTestId('clear-role-search'),
    },
    taTili: {
      tili: (index: number) => {
        const tiliLocator = page.locator(`#ta-tili-select-${index}`)
        const container = page.locator(`#ta-tili-container-${index}`)
        return {
          ...createReactSelectLocators(tiliLocator, 'taTiliSelection'),
          koulutusaste: (index: number) => {
            const selectLocator = container.locator(`#koulutusaste-select-${index}`)
            return {
              ...createReactSelectLocators(selectLocator, 'koulutusasteSelection'),
              select: selectLocator,
              addKoulutusasteBtn: container.locator(
                'button[title="Lisää uusi koulutusastevalinta"]'
              ),
              removeKoulutusasteBtn: (aste: string) =>
                container.locator(`button[title="Poista koulutusaste ${aste} talousarviotililtä"]`),
            }
          },
          addTiliBtn: container.locator('button[title="Lisää talousarviotili"]'),
          removeTiliBtn: container.locator('button[title="Poista talousarviotili"]'),
        }
      },
    },
  }

  async function publishAvustushaku() {
    await locators.status.published.click()
    await expect(common.locators.savingToast.locator('text="Tallennetaan"')).toBeVisible({
      timeout: 10000,
    })
    await common.waitForSave()
  }

  async function setAvustushakuInDraftState() {
    await locators.status.draft.click()
    await common.waitForSave()
  }

  async function resolveAvustushaku() {
    await locators.status.resolved.click()
    await common.waitForSave()
  }

  async function allowExternalApi(allow: boolean) {
    await page.click(`label[for="allow_visibility_in_external_system_${allow}"]`)
    await common.waitForSave()
  }

  async function setStartDate(time: moment.Moment) {
    await locators.hakuAika.start.fill(formatDate(time))
    await locators.hakuAika.start.blur()
    await common.waitForSave()
  }

  async function setEndDate(endTime: string) {
    await locators.hakuAika.end.fill(endTime)
    await locators.hakuAika.end.blur()
    await common.waitForSave()
  }

  async function closeAvustushakuByChangingEndDateToPast() {
    const previousYear = new Date().getFullYear() - 1
    await setEndDate(`1.1.${previousYear} 0.00`)
  }

  async function selectCode(codeType: 'operational-unit' | 'project', code: string): Promise<void> {
    const selectLocators = createReactSelectLocators(
      locators.dropdownForCode(codeType),
      `code-value-dropdown-${codeType}-id`
    )
    await selectLocators.input.click()
    await page.getByTestId(code).click()
  }

  async function fillCode(codeType: 'operational-unit' | 'project' | 'operation', code: string) {
    const selectLocators = createReactSelectLocators(
      locators.dropdownForCode(codeType),
      `code-value-dropdown-${codeType}-id`
    )
    await selectLocators.input.fill(code)
  }

  async function selectProject(code: string) {
    await locators.selectProject.click()
    await locators.selectProject.pressSequentially(code)
    await page.getByTestId(code).click()
  }

  async function overrideProject(code: string, codeToOverride: string) {
    await locators.selectProjectWithCode(codeToOverride).click()
    await page.getByTestId(code).click()
  }

  async function selectVaCodes(codes: VaCodeValues | undefined) {
    if (!codes) throw new Error('No VaCodeValues provided, cannot continue')

    await selectCode('operational-unit', codes.operationalUnit)

    for (const projectCode of codes.project) {
      if (projectCode !== NoProjectCodeProvided.code) {
        await locators.addProject.last().click()
        await locators.selectProjectWithCode(NoProjectCodeProvided.code).click()
        await page.getByTestId(projectCode).click()
      }
    }
  }

  async function addValmistelija(name: string, waitForSave = true) {
    await locators.hakuRole.searchInput.fill(name)
    await page.locator('a').getByText(name).click()
    if (waitForSave) {
      await common.waitForSave()
    }
  }

  async function setUserRole(
    name: string,
    role: 'presenting_officer' | 'evaluator' | 'vastuuvalmistelija'
  ) {
    const testId = 'role-' + name.toLowerCase().replace(' ', '-')
    await page.selectOption(`[data-test-id="${testId}"] select[name=role]`, role)
    // tab out of the field to trigger save
    await page.keyboard.press('Tab')
  }

  async function addArvioija(name: string, waitForSave = true) {
    await locators.hakuRole.searchInput.fill(name)
    await page.locator('a').getByText(name).click()
    await setUserRole(name, 'evaluator')
    if (waitForSave) {
      await common.waitForSave()
    }
  }

  async function addVastuuvalmistelija(name: string) {
    await locators.hakuRole.searchInput.fill(name)
    await page.locator('a').getByText(name).click()
    await setUserRole(name, 'vastuuvalmistelija')
    await common.waitForSave()
  }

  async function getInputPlaceholderCodeStyles(
    codeType: 'operational-unit' | 'project'
  ): Promise<CSSStyleDeclaration> {
    const locator = page.getByTestId(`singlevalue-${codeType}`)
    await expect(locator).toBeVisible()
    return locator.evaluate((e) => getComputedStyle(e))
  }

  async function getInputOptionCodeStyles(code: string): Promise<CSSStyleDeclaration> {
    const codeLocator = page.getByTestId(code)
    await expect(codeLocator).toBeVisible()
    return await codeLocator.evaluate((e) => getComputedStyle(e))
  }

  return {
    common,
    locators,
    publishAvustushaku,
    setAvustushakuInDraftState,
    resolveAvustushaku,
    allowExternalApi,
    setStartDate,
    setEndDate,
    closeAvustushakuByChangingEndDateToPast,
    selectVaCodes,
    fillCode,
    selectCode,
    selectProject,
    overrideProject,
    addValmistelija,
    addVastuuvalmistelija,
    addArvioija,
    getInputOptionCodeStyles,
    getInputPlaceholderCodeStyles,
  }
}
