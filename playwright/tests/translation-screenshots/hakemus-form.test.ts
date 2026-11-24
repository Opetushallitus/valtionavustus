import { Page } from '@playwright/test'
import { submittedHakemusTest as test } from '../../fixtures/muutoshakemusTest'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { TEST_Y_TUNNUS } from '../../utils/constants'
import {
  fiText,
  shootTranslation,
  writeTranslationManifest,
} from '../../utils/translationScreenshots'

const manifest: Record<string, string | null> = {}

async function shoot(page: Page, keys: string[]) {
  for (const key of keys) manifest[key] ??= await shootTranslation(page, key, fiText(key)!)
}

test('screenshots of translated strings on hakemus form', async ({
  page,
  avustushakuID,
  answers,
}) => {
  const hakijaPage = HakijaAvustusHakuPage(page)

  await hakijaPage.navigate(avustushakuID, 'fi')
  // login page renders after async fetches, shooting before that finds nothing
  await hakijaPage.form.muutoshakuEnabledFields.primaryEmail.waitFor()
  await shoot(page, ['login.heading', 'login.submit'])

  const hakemusUrl = await hakijaPage.startApplication(avustushakuID, answers.contactPersonEmail)
  await page.goto(hakemusUrl)
  // y-tunnus modal blocks the form
  await hakijaPage.fillInBusinessId(TEST_Y_TUNNUS)
  await hakijaPage.form.muutoshakuEnabledFields.projectName.fill(answers.projectName!)
  await hakijaPage.waitForEditSaved()
  await shoot(page, [
    'form.heading',
    'form.heading-hakemus',
    'form.submit',
    'form.preview',
    'form.saved',
  ])

  // validation errors of untouched fields only show up after a reload
  await page.reload()
  await page.locator('#form-error-summary a.validation-errors-summary').click()
  await shoot(page, ['errors.required'])

  writeTranslationManifest('hakemus-form', manifest)
})
