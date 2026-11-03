import { test, expect, Request } from '@playwright/test'
import * as path from 'path'
import { readFile } from 'fs/promises'
import moment from 'moment'

import { defaultValues } from '../fixtures/defaultValues'
import { HakujenHallintaPage } from '../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { HakulomakePage } from '../pages/virkailija/hakujen-hallinta/HakulomakePage'
import { switchUserIdentityTo } from '../utils/util'
import { VIRKAILIJA_URL } from '../utils/constants'

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
    await formEditorPage.showPreviousVersion()
    await expect(locators.versionBanner).toBeVisible()
    await expect(locators.field(restorableFieldId)).toBeVisible()
    await expect(locators.saveFormButton).toBeEnabled()

    await locators.returnToCurrentVersionButton.click()
    await expect(locators.versionBanner).toBeHidden()
    await expect(locators.form).toHaveValue(savedForm)
    await expect(locators.field(restorableFieldId)).toBeHidden()
    await expect(locators.saveFormButton).toBeDisabled()
  })

  await test.step('previous version brings the field back', async () => {
    await formEditorPage.showPreviousVersion()
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

  await test.step('saving hakulomake requires edit-haku privilege', async () => {
    const formUrl = `${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/form`
    const form = await (await page.request.get(formUrl, { failOnStatusCode: true })).json()

    await switchUserIdentityTo(page, 'viivivirkailija')
    const forbiddenResponse = await page.request.post(formUrl, { data: form })
    expect(forbiddenResponse.status()).toEqual(403)
    for (const path of ['/versions', '/versions/0']) {
      const response = await page.request.get(`${formUrl}${path}`)
      expect(response.status()).toEqual(403)
    }

    await switchUserIdentityTo(page, 'valtionavustus')
    await formEditorPage.waitFormToBeLoaded()
    await expect(locators.previousVersionButton).toBeEnabled()
    const allowedResponse = await page.request.post(formUrl, { data: form })
    expect(allowedResponse.status()).toEqual(200)
  })

  await test.step('only pääkäyttäjä can browse versions, not even a valmistelija', async () => {
    const hakuUrl = `${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}`
    for (const path of ['/form/versions', '/form/versions/0']) {
      await expect(await page.request.get(`${hakuUrl}${path}`)).toBeOK()
    }
    await page.request.put(`${hakuUrl}/role`, {
      failOnStatusCode: true,
      data: {
        name: 'Viivi Virkailija',
        email: 'viivi.virkailja@exmaple.com',
        role: 'presenting_officer',
        oid: '1.2.246.562.24.99000000002',
      },
    })

    const historyRequests: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('/form/versions')) historyRequests.push(request.url())
    })
    await switchUserIdentityTo(page, 'viivivirkailija')
    await formEditorPage.waitFormToBeLoaded()
    await expect(locators.form).toBeEnabled()
    await expect(locators.previousVersionButton).toHaveCount(0)
    await expect(page.getByTestId('next-form-version')).toHaveCount(0)
    expect(historyRequests).toEqual([])

    for (const path of ['/form/versions', '/form/versions/0']) {
      const response = await page.request.get(`${hakuUrl}${path}`)
      expect(response.status()).toEqual(403)
    }
    const form = await locators.form.inputValue()
    await expect(await page.request.post(`${hakuUrl}/form`, { data: JSON.parse(form) })).toBeOK()
  })
})

for (const selvitysType of ['valiselvitys', 'loppuselvitys'] as const) {
  defaultValues(`Browsing and restoring ${selvitysType} form versions`, async ({ page }) => {
    const hakujenHallinta = new HakujenHallintaPage(page)
    const avustushakuID = await hakujenHallinta.copyEsimerkkihaku()
    await hakujenHallinta.navigateTo(`/admin/${selvitysType}/?avustushaku=${avustushakuID}`)
    const formEditorPage = HakulomakePage(page)
    const { locators } = formEditorPage
    const selvitysFormUrl = `${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/selvitysform/${selvitysType}`
    const recreateFormButton = page.getByRole('button', { name: 'Palauta alkuperäiset kysymykset' })
    await formEditorPage.waitFormToBeLoaded()

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
      await formEditorPage.showPreviousVersion()
      await expect(locators.versionBanner).toBeVisible()
      await expect(locators.field(restorableFieldId)).toBeVisible()
      await expect(locators.saveFormButton).toBeEnabled()

      await locators.returnToCurrentVersionButton.click()
      await expect(locators.versionBanner).toBeHidden()
      await expect(locators.form).toHaveValue(savedForm)
      await expect(locators.field(restorableFieldId)).toBeHidden()
      await expect(locators.saveFormButton).toBeDisabled()
    })

    await test.step('previous version brings the field back', async () => {
      await formEditorPage.showPreviousVersion()
      await expect(locators.versionBanner).toBeVisible()
      await expect(locators.field(restorableFieldId)).toBeVisible()
      await expect(locators.restoredFieldTag(restorableFieldId)).toHaveText(
        'Kenttä puuttuu nykyisestä versiosta'
      )
      await expect(locators.changedFieldTag(changedFieldId)).toHaveText(
        'Sisältö eroaa nykyisestä versiosta'
      )
    })

    await test.step('restored version stays after saving', async () => {
      await formEditorPage.saveForm()
      await expect(locators.versionBanner).toBeHidden()
      await page.reload()
      await formEditorPage.waitFormToBeLoaded()
      await expect(locators.field(restorableFieldId)).toBeVisible()
    })

    await test.step('version list is fetched once on page load', async () => {
      const versionListRequests: string[] = []
      const collectVersionListRequests = (request: Request) => {
        if (request.url().endsWith(`/selvitysform/${selvitysType}/versions`)) {
          versionListRequests.push(request.url())
        }
      }
      page.on('request', collectVersionListRequests)
      await page.reload()
      await formEditorPage.waitFormToBeLoaded()
      await expect(locators.previousVersionButton).toBeEnabled()
      page.off('request', collectVersionListRequests)
      expect(versionListRequests).toHaveLength(1)
    })

    await test.step('only pääkäyttäjä can browse versions', async () => {
      for (const path of ['/versions', '/versions/0']) {
        await expect(await page.request.get(`${selvitysFormUrl}${path}`)).toBeOK()
      }

      const historyRequests: string[] = []
      page.on('request', (request) => {
        if (request.url().includes('/versions')) historyRequests.push(request.url())
      })
      await switchUserIdentityTo(page, 'viivivirkailija')
      await formEditorPage.waitFormToBeLoaded()
      await expect(locators.previousVersionButton).toHaveCount(0)
      await expect(page.getByTestId('next-form-version')).toHaveCount(0)
      expect(historyRequests).toEqual([])

      for (const path of ['/versions', '/versions/0']) {
        const response = await page.request.get(`${selvitysFormUrl}${path}`)
        expect(response.status()).toEqual(403)
      }
    })

    await test.step('saving selvitys form requires edit-haku privilege', async () => {
      const form = JSON.parse(await locators.form.inputValue())
      await expect(locators.form).toBeDisabled()
      await expect(
        page.getByText('Sinulla ei ole muokkausoikeutta tähän lomakkeeseen')
      ).toBeVisible()
      await expect(recreateFormButton).toBeDisabled()
      const forbiddenResponse = await page.request.post(selvitysFormUrl, { data: form })
      expect(forbiddenResponse.status()).toEqual(403)
    })

    await test.step('unknown selvitys type is rejected without touching the forms', async () => {
      const form = JSON.parse(await locators.form.inputValue())
      const hakuUrl = `${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}`
      for (const url of [`${hakuUrl}/init-selvitysform/x`, `${hakuUrl}/selvitysform/x`]) {
        const response = await page.request.post(url, { data: { ...form, content: [] } })
        expect(response.status()).toEqual(400)
      }
      await page.reload()
      await formEditorPage.waitFormToBeLoaded()
      expect(JSON.parse(await locators.form.inputValue())).toEqual(form)
    })

    await test.step('valmistelija can save selvitys form but not browse versions', async () => {
      const form = JSON.parse(await locators.form.inputValue())
      await switchUserIdentityTo(page, 'valtionavustus')
      await page.request.put(`${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/role`, {
        failOnStatusCode: true,
        data: {
          name: 'Viivi Virkailija',
          email: 'viivi.virkailja@exmaple.com',
          role: 'presenting_officer',
          oid: '1.2.246.562.24.99000000002',
        },
      })
      await switchUserIdentityTo(page, 'viivivirkailija')
      await formEditorPage.waitFormToBeLoaded()
      await expect(locators.form).toBeEnabled()
      await expect(recreateFormButton).toBeEnabled()
      await expect(locators.previousVersionButton).toHaveCount(0)
      for (const path of ['/versions', '/versions/0']) {
        const response = await page.request.get(`${selvitysFormUrl}${path}`)
        expect(response.status()).toEqual(403)
      }
      await expect(await page.request.post(selvitysFormUrl, { data: form })).toBeOK()
    })
  })
}
