import { Dialog, expect, Page } from '@playwright/test'
import { expectToBeDefined } from '../../../utils/util'
import { Field } from '../../../utils/types'
import { saveStatusTestId } from './CommonHakujenHallintaPage'

export function HakulomakePage(page: Page) {
  const lomakeWarning = page.getByTestId('validation-warning')
  const locators = {
    formErrorState: page.getByTestId('form-error-state'),
    form: page.locator('.form-json-editor textarea'),
    fieldId: page.locator('span.soresu-field-id'),
    saveFormButton: page.locator('#saveForm'),
    lomakeWarning,
    lomakeWarningBtn: page.getByText('Näytä lisätietoja'),
    lomakeWarningId: page.getByTestId('validation-dropdown-item-id'),
    lomakeWarningLabel: page.getByTestId('validation-dropdown-item-label'),
    muutoshakuOk: page.getByTestId('validation-ok'),
  }

  async function waitFormToBeLoaded() {
    await expect(locators.form).toContainText('{')
  }

  /*
    for some reason
    await page.fill(".form-json-editor textarea", lomakeJson)
    takes almost 50seconds
  */
  async function replaceLomakeJson(lomakeJson: string) {
    await locators.form.evaluate((textarea, lomakeJson) => {
      ;(textarea as HTMLTextAreaElement).value = lomakeJson
    }, lomakeJson)
  }

  async function changeLomakeJson(lomakeJson: string) {
    await waitFormToBeLoaded()
    await expect(locators.saveFormButton).toBeDisabled()
    await replaceLomakeJson(lomakeJson)
    await expect(locators.saveFormButton).toBeDisabled()
    // trigger autosave by typing space in the end
    await locators.form.pressSequentially(' ')
    await expect(locators.saveFormButton).toBeEnabled()
  }

  async function saveForm() {
    await expect(locators.saveFormButton).toBeEnabled()
    await locators.saveFormButton.click()
    await expect(locators.saveFormButton).toBeDisabled()
    await expect(
      page.getByTestId(saveStatusTestId).getByText('Kaikki tiedot tallennettu')
    ).toBeVisible()
  }

  async function getFieldIds() {
    const ids = await locators.fieldId.evaluateAll((elems) => elems.map((e) => e.textContent))
    return ids.filter((id): id is string => id !== null)
  }

  async function addField(afterFieldId: string, newFieldType: string) {
    await page.getByTestId(`field-add-${afterFieldId}`).hover()
    await page.click(
      `[data-test-id="field-${afterFieldId}"] [data-test-id="add-field-${newFieldType}"]`
    )
    await locators.fieldId.first() // hover on something else so that the added content from first hover doesn't change page coordinates
  }

  async function removeField(fieldId: string) {
    async function acceptDialog(dialog: Dialog) {
      await dialog.accept('Oletko varma, että haluat poistaa kentän?')
    }
    page.on('dialog', acceptDialog)
    const fieldIdWithText = `text="${fieldId}"`
    await locators.fieldId.locator(fieldIdWithText).waitFor()
    await Promise.all([
      // without position this clicks the padding and does nothing
      page.getByTestId(`delete-field-${fieldId}`).click({
        position: { x: 15, y: 5 },
      }),
      locators.fieldId.locator(fieldIdWithText).waitFor({ state: 'detached' }),
    ])
    page.removeListener('dialog', acceptDialog)
  }

  async function moveField(fieldId: string, direction: 'up' | 'down') {
    const fields = await getFieldIds()
    const originalIndex = fields.indexOf(fieldId)
    const expectedIndex = direction === 'up' ? originalIndex - 1 : originalIndex + 1
    await page.getByTestId(`move-field-${direction}-${fieldId}`).click()
    await page.waitForFunction(
      ({ fieldId, expectedIndex }) => {
        const fieldIds = Array.from(document.querySelectorAll('span.soresu-field-id')).map(
          (e) => e.textContent
        )
        return fieldIds[expectedIndex] === fieldId
      },
      { expectedIndex, fieldId }
    )
  }

  async function addKoodisto(koodisto: string) {
    await page.locator('.soresu-field-add-header').first().hover()
    await page.click('text=Koodistokenttä')
    await page.click(`text="${koodisto}"`)
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await page.locator('label:text-is("Pudotusvalikko")').first().click()
  }

  function fieldJson(type: string, id: string, label: string) {
    return {
      fieldClass: 'wrapperElement',
      id: id + 'wrapper',
      fieldType: 'theme',
      children: [
        {
          label: {
            fi: label + 'fi',
            sv: label + 'sv',
          },
          fieldClass: 'formField',
          helpText: {
            fi: 'helpText fi',
            sv: 'helpText sv',
          },
          id: id,
          params: {
            size: 'small',
            maxlength: 1000,
          },
          required: true,
          fieldType: type,
        },
      ],
    }
  }

  async function addFields(...fields: (Field & { fieldLabel: string })[]) {
    const formContent = await locators.form.textContent()
    expectToBeDefined(formContent)
    const json = JSON.parse(formContent)
    const { content } = json
    const fieldsJson = fields.map(({ fieldId, type, fieldLabel }) =>
      fieldJson(type, fieldId, fieldLabel)
    )
    const newJson = { ...json, content: [...content, ...fieldsJson] }
    await replaceLomakeJson(JSON.stringify(newJson))
    await locators.form.pressSequentially(' ')
    await saveForm()
  }

  return {
    locators,
    waitFormToBeLoaded,
    changeLomakeJson,
    saveForm,
    addFields,
    addField,
    getFieldIds,
    removeField,
    moveField,
    addKoodisto,
  }
}
