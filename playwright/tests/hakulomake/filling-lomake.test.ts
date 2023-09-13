import { defaultValues as test } from '../../fixtures/defaultValues'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { Page, expect } from '@playwright/test'
import { expectToBeDefined } from '../../utils/util'

const typeValueInFieldAndExpectValidationError = async ({
  page,
  fieldLabel,
  errorMessage,
  fieldValue,
  fieldId,
  fieldValueAfter,
}: {
  page: Page
  fieldId: string
  fieldValue: string
  fieldLabel: string
  errorMessage: string
  fieldValueAfter: string
}) => {
  const field = page.locator(`#${fieldId}`)
  const errorSummary = page.locator('a.validation-errors-summary')
  await expect(errorSummary).toBeHidden()
  await field.fill(fieldValue)
  await expect(errorSummary).toHaveText('1 vastauksessa puutteita')
  await errorSummary.click()
  await expect(page.locator('.validation-errors')).toHaveText(fieldLabel + errorMessage)
  const submit = page.locator('#submit')
  await expect(submit).toBeDisabled()
  await field.fill(fieldValueAfter)
}

test('can add and validate different fields', async ({
  page,
  hakuProps,
  answers,
  userCache,
}, testInfo) => {
  testInfo.setTimeout(testInfo.timeout + 30_000)
  expectToBeDefined(userCache)
  const hakujenHallintaPage = new HakujenHallintaPage(page)
  const haunTiedotPage = await hakujenHallintaPage.navigate(1)
  const avustushakuID = await hakujenHallintaPage.createMuutoshakemusEnabledHaku(hakuProps)
  await haunTiedotPage.setAvustushakuInDraftState()
  const hakulomakePage = await hakujenHallintaPage.commonHakujenHallinta.switchToHakulomakeTab()
  const decimalField = {
    type: 'decimalField',
    fieldId: 'id-decimalField',
    fieldLabel: 'label-decimalField',
  }
  const integerField = {
    type: 'integerField',
    fieldId: 'id-integerField',
    fieldLabel: 'label-integerField',
  }
  await hakulomakePage.addKoodisto('ammattiluokitus')
  await hakulomakePage.addFields(decimalField, integerField)
  await hakujenHallintaPage.navigate(avustushakuID)
  await hakujenHallintaPage.commonHakujenHallinta.switchToHaunTiedotTab()
  await haunTiedotPage.publishAvustushaku()
  const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
  await hakijaAvustusHakuPage.navigate(avustushakuID, 'fi')
  await hakijaAvustusHakuPage.startAndFillApplication(answers, avustushakuID)
  await hakijaAvustusHakuPage.fillMuutoshakemusEnabledHakemus(answers, async () => {
    await page.locator('#koodistoField-0_input').click()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await typeValueInFieldAndExpectValidationError({
      page,
      fieldId: decimalField.fieldId,
      fieldValue: 'Not a decimal',
      fieldLabel: decimalField.fieldLabel,
      errorMessage: 'fi: Syötä yksi numeroarvo',
      fieldValueAfter: '123.0',
    })
    await typeValueInFieldAndExpectValidationError({
      page,
      fieldId: integerField.fieldId,
      fieldValue: 'Not an integer',
      fieldLabel: integerField.fieldLabel,
      errorMessage: 'fi: Syötä arvo kokonaislukuina',
      fieldValueAfter: '123',
    })
  })
  await hakijaAvustusHakuPage.submitApplication()
})
