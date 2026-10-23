import { test, expect } from '@playwright/test'
import * as path from 'path'
import { readFile } from 'fs/promises'
import moment from 'moment'

import { defaultValues } from '../fixtures/defaultValues'
import { HakujenHallintaPage } from '../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { HakulomakePage } from '../pages/virkailija/hakujen-hallinta/HakulomakePage'

defaultValues('Editing hakulomake', async ({ page, hakuProps }) => {
  const puuttuvaYhteyshenkilonNimiJson = await readFile(
    path.join(__dirname, '../fixtures/prod.hakulomake.json'),
    { encoding: 'utf8' }
  )
  const hakujenHallinta = new HakujenHallintaPage(page)
  const avustushakuID = await hakujenHallinta.copyEsimerkkihaku()
  const haunTiedotPage = await hakujenHallinta.commonHakujenHallinta.switchToHaunTiedotTab()
  await haunTiedotPage.selectVaCodes(hakuProps.vaCodes)
  await haunTiedotPage.setStartDate(moment().subtract(1, 'day'))
  const formEditorPage = await hakujenHallinta.navigateToFormEditor(avustushakuID)

  await test.step('save button is disabled without changes', async () => {
    await formEditorPage.locators.saveFormButton.isDisabled()
  })

  await test.step('changing hakulomake json enables save button', async () => {
    await formEditorPage.changeLomakeJson(puuttuvaYhteyshenkilonNimiJson)
    await formEditorPage.locators.saveFormButton.isEnabled()
  })

  await test.step('saving the form disables save button', async () => {
    await formEditorPage.saveForm()
    await formEditorPage.locators.saveFormButton.isDisabled()
  })

  await test.step('field can be added', async () => {
    const fields = await formEditorPage.getFieldIds()
    await formEditorPage.addField(fields[0], 'link')
    const newFields = await formEditorPage.getFieldIds()
    const expectedFields = [fields[0], 'link-0', ...fields.slice(1)]
    expect(newFields).toEqual(expectedFields)
  })

  await test.step('field can be removed', async () => {
    const fields = await formEditorPage.getFieldIds()
    await formEditorPage.removeField('link-0')
    const newFields = await formEditorPage.getFieldIds()
    const expectedFields = fields.filter((f) => f !== 'link-0')
    expect(newFields).toEqual(expectedFields)
  })

  await test.step('field can be moved', async () => {
    const fields = await formEditorPage.getFieldIds()

    await formEditorPage.moveField('duration-help', 'up')
    const fieldsAfterMoveUp = await formEditorPage.getFieldIds()
    const movedUpFields = [fields[0], 'duration-help', 'duration', ...fields.slice(3)]
    expect(fieldsAfterMoveUp).toEqual(movedUpFields)

    await formEditorPage.moveField('duration-help', 'down')
    const fieldsAfterMoveDown = await formEditorPage.getFieldIds()
    const movedDownFields = [fields[0], 'duration', 'duration-help', ...fields.slice(3)]
    expect(fieldsAfterMoveDown).toEqual(movedDownFields)
  })

  await test.step('field can be edited', async () => {
    const textToSave = 'tähellä merkityt ompi täytettävä'
    await page.fill('[name="p-1-text-fi"]', textToSave)
    await formEditorPage.saveForm()
    await formEditorPage.locators.saveFormButton.isDisabled()

    await expect(page.locator('[name="p-1-text-fi"]')).toHaveText(textToSave)
  })

  await test.step('(nested) field can be added into a fieldset', async () => {
    const fields = await formEditorPage.getFieldIds()
    const organizationEmailIndex = fields.indexOf('organization-email')
    await formEditorPage.addField('organization-email', 'namedAttachment')
    const newFields = await formEditorPage.getFieldIds()
    const expectedFields = [
      ...fields.slice(0, organizationEmailIndex + 1),
      'namedAttachment-0',
      ...fields.slice(organizationEmailIndex + 1),
    ]
    expect(newFields).toEqual(expectedFields)
  })

  await test.step('(nested) field can be removed from a fieldset', async () => {
    const fields = await formEditorPage.getFieldIds()
    await formEditorPage.removeField('namedAttachment-0')
    const newFields = await formEditorPage.getFieldIds()
    const expectedFields = fields.filter((f) => f !== 'namedAttachment-0')
    expect(newFields).toEqual(expectedFields)
  })

  await test.step('(nested) field can be moved inside a fieldset', async () => {
    const fields = await formEditorPage.getFieldIds()
    const organizationEmailIndex = fields.indexOf('organization')

    await formEditorPage.moveField('organization', 'down')
    const fieldsAfterMoveUp = await formEditorPage.getFieldIds()
    const movedUpFields = [
      ...fields.slice(0, organizationEmailIndex),
      'organization-email',
      'organization',
      ...fields.slice(organizationEmailIndex + 2),
    ]
    expect(fieldsAfterMoveUp).toEqual(movedUpFields)

    await formEditorPage.moveField('organization', 'up')
    const fieldsAfterMoveDown = await formEditorPage.getFieldIds()
    const movedDownFields = [
      ...fields.slice(0, organizationEmailIndex),
      'organization',
      'organization-email',
      ...fields.slice(organizationEmailIndex + 2),
    ]
    expect(fieldsAfterMoveDown).toEqual(movedDownFields)
  })

  await test.step('(nested) field can be edited inside a fieldset', async () => {
    const textToSave = 'hakijampa nimmee kyselläämpi'
    await page.fill('[name="organization-label-fi"]', textToSave)
    await formEditorPage.saveForm()
    await formEditorPage.locators.saveFormButton.isDisabled()

    const savedTextArea = await page.textContent('[name="organization-label-fi"]')
    expect(savedTextArea).toEqual(textToSave)
  })
})

defaultValues('Editing väliselvitys lomake', async ({ page, hakuProps }) => {
  const hakujenHallinta = new HakujenHallintaPage(page)
  await hakujenHallinta.copyEsimerkkihaku()
  const haunTiedotPage = await hakujenHallinta.commonHakujenHallinta.switchToHaunTiedotTab()
  await haunTiedotPage.selectVaCodes(hakuProps.vaCodes)
  await haunTiedotPage.setStartDate(moment().subtract(1, 'day'))
  await hakujenHallinta.waitForSave()
  await hakujenHallinta.commonHakujenHallinta.switchToValiselvitysTab()
  const formEditorPage = HakulomakePage(page)

  await test.step('save button is disabled without changes', async () => {
    await formEditorPage.locators.saveFormButton.isDisabled()
  })

  await test.step('changing hakulomake enables save button', async () => {
    await page.fill('[name="applicant-info-label-fi"]', 'uus title')
    await formEditorPage.locators.saveFormButton.isEnabled()
  })

  await test.step('saving the form disables save button', async () => {
    await formEditorPage.saveForm()
    await formEditorPage.locators.saveFormButton.isDisabled()
  })
})

defaultValues('Editing loppuselvitys lomake', async ({ page, hakuProps }) => {
  const hakujenHallinta = new HakujenHallintaPage(page)
  await hakujenHallinta.copyEsimerkkihaku()
  const haunTiedotPage = await hakujenHallinta.commonHakujenHallinta.switchToHaunTiedotTab()
  await haunTiedotPage.selectVaCodes(hakuProps.vaCodes)
  await haunTiedotPage.setStartDate(moment().subtract(1, 'day'))
  await hakujenHallinta.waitForSave()
  await hakujenHallinta.switchToLoppuselvitysTab()
  const formEditorPage = HakulomakePage(page)

  await test.step('save button is disabled without changes', async () => {
    await formEditorPage.locators.saveFormButton.isDisabled()
  })

  await test.step('changing hakulomake enables save button', async () => {
    await page.fill('[name="applicant-info-label-fi"]', 'uus title')
    await formEditorPage.locators.saveFormButton.isEnabled()
  })

  await test.step('saving the form disables save button', async () => {
    await formEditorPage.saveForm()
    await formEditorPage.locators.saveFormButton.isDisabled()
  })
})

const restorableFieldId = 'restorable-field'
const changedFieldId = 'changed-field'

defaultValues('Browsing and restoring hakulomake versions', async ({ page, hakuProps }) => {
  const hakujenHallinta = new HakujenHallintaPage(page)
  const avustushakuID = await hakujenHallinta.copyEsimerkkihaku()
  const haunTiedotPage = await hakujenHallinta.commonHakujenHallinta.switchToHaunTiedotTab()
  await haunTiedotPage.selectVaCodes(hakuProps.vaCodes)
  await haunTiedotPage.setStartDate(moment().subtract(1, 'day'))
  await hakujenHallinta.waitForSave()
  const formEditorPage = await hakujenHallinta.navigateToFormEditor(avustushakuID)
  const { locators } = formEditorPage

  await formEditorPage.addFields({
    fieldId: changedFieldId,
    type: 'textField',
    fieldLabel: 'Yhteyshenkilö',
  })
  const formWithoutField = await locators.form.inputValue()

  await test.step('save version with an extra field', async () => {
    await formEditorPage.addFields({
      fieldId: restorableFieldId,
      type: 'textField',
      fieldLabel: 'Palautettava kenttä',
    })
    await expect(locators.field(restorableFieldId)).toBeVisible()
  })

  await test.step('save version without the field and with a changed label', async () => {
    await formEditorPage.changeLomakeJson(
      formWithoutField.replace('Yhteyshenkilöfi', 'Yhteysmiesfi')
    )
    await formEditorPage.saveForm()
    await expect(locators.field(restorableFieldId)).toBeHidden()
  })

  await test.step('returning to current version restores the saved form', async () => {
    const savedForm = await locators.form.inputValue()
    await locators.previousVersionButton.click()
    await expect(locators.versionBanner).toBeVisible()
    await expect(locators.saveFormButton).toBeEnabled()

    await locators.returnToCurrentVersionButton.click()
    await expect(locators.versionBanner).toBeHidden()
    await expect(locators.form).toHaveValue(savedForm)
    await expect(locators.field(restorableFieldId)).toBeHidden()
    await expect(locators.saveFormButton).toBeDisabled()
  })

  await test.step('previous version brings the field back', async () => {
    await locators.previousVersionButton.click()
    await expect(locators.versionBanner).toBeVisible()
    await expect(locators.field(restorableFieldId)).toBeVisible()
    await expect(locators.restoredFieldTag(restorableFieldId)).toHaveText(
      'Kenttä puuttuu nykyisestä versiosta'
    )
    await expect(locators.changedFieldTag(restorableFieldId)).toBeHidden()
    await expect(locators.changedFieldTag(changedFieldId)).toHaveText(
      'Sisältö eroaa nykyisestä versiosta'
    )
    await expect(locators.changedFieldTag(`${changedFieldId}wrapper`)).toBeHidden()
  })

  await test.step('restored version stays after saving', async () => {
    await formEditorPage.saveForm()
    await expect(locators.versionBanner).toBeHidden()
    await page.reload()
    await formEditorPage.waitFormToBeLoaded()
    await expect(locators.field(restorableFieldId)).toBeVisible()
  })

})
