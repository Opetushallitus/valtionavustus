import { expect, Page } from '@playwright/test'
import { submittedHakemusTest } from '../../fixtures/muutoshakemusTest'
import prodHakulomake from '../../fixtures/prod.hakulomake.json'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { dummyPdfPath, TEST_Y_TUNNUS } from '../../utils/constants'
import {
  clearTranslationMarks,
  fiText,
  shootTranslation,
  writeTranslationManifest,
} from '../../utils/translationScreenshots'

const keys = [
  'languages',
  'warning.old-browser',
  'warning.old-browser-update-link-text',
  'warning.old-browser-update-link',
  'login.preview',
  'login.preview-link',
  'login.contact-email',
  'login.message',
  'login.help',
  'login.notopen',
  'form.lengthleft',
  'form.saving',
  'form.print-version',
  'form.hakemus-not-submitted',
  'form.submitted',
  'form.submitted-hakemus',
  'form.savehelp-hakemus',
  'form.has-ended',
  'form.preview',
  'form.table-field.sum-title',
  'form.attachment.uploadhere',
  'form.attachment.attached',
  'form.attachment.attachmentMissing',
  'errors.email',
  'errors.money',
  'errors.integer',
  'errors.decimal',
  'errors.table-misses-one-value',
  'errors.table-misses-many-values',
  'errors.table-has-one-invalid-value',
  'errors.table-has-many-invalid-values',
  'errors.finnishBusinessId',
  'errors.iban',
  'errors.bic',
  'errors.validation-errors',
  'errors.unexpected-submit-error',
  'errors.unexpected-save-error',
  'errors.conflict-save-error',
  'errors.submit-validation-errors',
  'errors.attachment-has-illegal-content-type-error',
  'errors.attachment-save-error',
  'errors.attachment-remove-error',
  'misc.time',
  'misc.remove',
  'misc.register-number',
  'misc.cancel',
  'misc.give-businessid',
  'misc.get',
  'misc.business-id',
  'misc.not-found-business-id',
  'misc.error-with-business-id',
  'misc.confirm-business-id-info',
  'misc.organization-email',
  'misc.confirm',
  'misc.organisation-selection-info-1',
  'misc.organisation-selection-info-2',
  'misc.organisation-selection-info-3-before-email',
  'misc.organisation-selection-info-3-after-email',
]

// fiText cuts at the first {{, which leaves nothing for strings that start with a placeholder
const textOverrides: Record<string, string> = {
  'errors.validation-errors': 'vastauksessa puutteita',
}

const label = (fi: string) => ({ fi, sv: fi })
const field = (id: string, fieldType: string, params: object = {}) => ({
  id,
  fieldType,
  fieldClass: 'formField',
  label: label(id),
  helpText: label(''),
  required: false,
  params,
})

// prod form lacks integer, decimal, table and attachment fields
const hakulomake = {
  ...prodHakulomake,
  content: [
    ...prodHakulomake.content,
    {
      id: 'tr-extras',
      fieldType: 'theme',
      fieldClass: 'wrapperElement',
      label: label('Lisäkentät'),
      children: [
        field('tr-email', 'emailField', { size: 'small', maxlength: 80 }),
        field('tr-money', 'moneyField', { size: 'small', maxlength: 10 }),
        field('tr-integer', 'integerField', { size: 'small', maxlength: 10 }),
        field('tr-decimal', 'decimalField', { size: 'small', maxlength: 10 }),
        field('tr-business-id', 'finnishBusinessIdField', { size: 'small', maxlength: 9 }),
        field('tr-table', 'tableField', {
          rows: [
            { title: label('Rivi 1'), required: true },
            { title: label('Rivi 2'), required: true },
          ],
          columns: [
            {
              title: label('Arvo'),
              size: 'small',
              maxlength: 5,
              valueType: 'decimal',
              calculateSum: true,
              required: true,
            },
          ],
        }),
        field('tr-attachment', 'namedAttachment'),
        field('tr-attachment-missing', 'namedAttachment'),
      ],
    },
  ],
}

const test = submittedHakemusTest.extend({ hakulomake: JSON.stringify(hakulomake) })

const hakemusSaveUrl = /\/api\/avustushaku\/\d+\/hakemus\/[^/]+\/\d+$/
const organisationsUrl = /\/api\/organisations\//
const newHakemusUrl = /\/api\/avustushaku\/\d+\/hakemus$/

test.setTimeout(300_000)

test('translation screenshots: hakemus form, login and organisation selection', async ({
  page,
  avustushakuID,
  answers,
}) => {
  const manifest: Record<string, string | null> = {}
  const hakijaPage = HakijaAvustusHakuPage(page)

  const shoot = async (selectedKeys: string[]) => {
    for (const key of selectedKeys) {
      const text = textOverrides[key] ?? fiText(key)
      if (text) manifest[key] ??= await shootTranslation(page, key, text)
    }
  }
  const shootHovered = async (hoverTarget: string, key: string) => {
    await page.locator(hoverTarget).hover()
    await shoot([key])
  }
  const waitForNoPendingChanges = () =>
    page.waitForFunction(() => document.getElementById('pending-changes')?.textContent === 'false')
  // save errors only show after an autosave, so change something to trigger one
  const triggerSave = async (value: string) => {
    await page.locator('#tr-integer').fill(value)
  }

  await test.step('login page', async () => {
    await hakijaPage.navigate(avustushakuID, 'fi')
    await hakijaPage.form.muutoshakuEnabledFields.primaryEmail.waitFor()
    await shoot(['login.preview', 'login.preview-link', 'login.contact-email'])
    await shootHovered('h2 .soresu-help-icon', 'login.help')

    const primaryEmail = hakijaPage.form.muutoshakuEnabledFields.primaryEmail
    await primaryEmail.fill(answers.contactPersonEmail)
    await page.route(newHakemusUrl, (route) =>
      route.request().method() === 'PUT' ? route.fulfill({ status: 500 }) : route.continue()
    )
    await page.click('#submit')
    await expect(page.getByText(fiText('errors.unexpected-submit-error')!)).toBeVisible()
    await shoot(['errors.unexpected-submit-error'])
    await page.unrouteAll()

    // a response without an id shows the "link sent" message instead of redirecting
    await page.route(newHakemusUrl, (route) =>
      route.request().method() === 'PUT' ? route.fulfill({ json: {} }) : route.continue()
    )
    await page.click('#submit')
    await expect(page.getByText(fiText('login.message')!)).toBeVisible()
    await shoot(['login.message'])
    await page.unrouteAll()
  })

  await test.step('organisation selection', async () => {
    await hakijaPage.navigate(avustushakuID, 'fi')
    const hakemusUrl = await hakijaPage.startApplication(avustushakuID, answers.contactPersonEmail)
    await page.goto(hakemusUrl)
    await page.locator('#finnish-business-id').waitFor()
    await shoot([
      'misc.give-businessid',
      'misc.get',
      'misc.business-id',
      'misc.organisation-selection-info-1',
      'misc.organisation-selection-info-2',
      'misc.organisation-selection-info-3-before-email',
      'misc.organisation-selection-info-3-after-email',
    ])

    await page.locator('#finnish-business-id').fill(TEST_Y_TUNNUS)
    await page.route(organisationsUrl, (route) => route.fulfill({ status: 404 }))
    await page.locator('input.get-business-id').click()
    await page.locator('#not-found-business-id').waitFor()
    await shoot(['misc.not-found-business-id'])
    await page.unrouteAll()

    await page.route(organisationsUrl, (route) => route.fulfill({ status: 500 }))
    await page.locator('input.get-business-id').click()
    await page.locator('#other-error-business-id').waitFor()
    await shoot(['misc.error-with-business-id'])
    await page.unrouteAll()

    await page.locator('input.get-business-id').click()
    const orgSelection = page.locator('[data-test-id="organisation-selection-fi"]')
    await orgSelection.waitFor()
    await shoot(['misc.confirm-business-id-info', 'misc.organization-email', 'misc.confirm'])
    await orgSelection.click()
    const confirmButton = page.locator('[data-test-id="confirm-selection"]')
    await expect(confirmButton).toBeEnabled({ timeout: 10000 })
    await confirmButton.click()
    await expect(page.getByRole('dialog')).toBeHidden()
  })

  await test.step('edit form', async () => {
    await hakijaPage.form.muutoshakuEnabledFields.projectName.fill(answers.projectName!)
    await hakijaPage.waitForEditSaved()
    await shoot([
      'form.lengthleft',
      'form.print-version',
      'form.hakemus-not-submitted',
      'form.preview',
      'form.attachment.uploadhere',
    ])

    // hold the autosave so the transient "saving" message stays up
    await page.route(hakemusSaveUrl, async (route) => {
      if (route.request().method() === 'POST') await new Promise((r) => setTimeout(r, 3000))
      await route.continue()
    })
    await triggerSave('1')
    await expect(page.getByText(fiText('form.saving')!)).toBeVisible({ timeout: 10000 })
    await shoot(['form.saving'])
    await waitForNoPendingChanges()
    await page.unrouteAll()

    const serverErrors: [number, string][] = [
      [500, 'errors.unexpected-save-error'],
      [409, 'errors.conflict-save-error'],
      [400, 'errors.submit-validation-errors'],
    ]
    for (const [i, [status, key]] of serverErrors.entries()) {
      await page.route(hakemusSaveUrl, (route) =>
        route.request().method() === 'POST' ? route.fulfill({ status, json: {} }) : route.continue()
      )
      await triggerSave(String(i + 2))
      await expect(page.getByText(fiText(key)!)).toBeVisible({ timeout: 10000 })
      await clearTranslationMarks(page)
      await shoot([key])
      await page.unrouteAll()
    }
    await triggerSave('9')
    await waitForNoPendingChanges()

    await page.setInputFiles('#tr-attachment [type="file"]', dummyPdfPath)
    await expect(page.getByText(fiText('form.attachment.attached')!)).toBeVisible()
    await shoot(['form.attachment.attached', 'misc.time'])
  })

  await test.step('validation errors', async () => {
    await page.locator('#tr-email').fill('not-an-email')
    await page.locator('#tr-money').fill('abc')
    await page.locator('#tr-integer').fill('1.5')
    await page.locator('#tr-decimal').fill('abc')
    await page.locator('#tr-business-id').fill('1234567-8')
    await hakijaPage.form.bank.iban.fill('FI00')
    await hakijaPage.form.bank.bic.fill('XX')
    const cells = page.locator('#tr-table input')
    await cells.nth(0).fill('x')
    await page.locator('#form-error-summary a.validation-errors-summary').click()
    await shoot([
      'errors.validation-errors',
      'errors.email',
      'errors.money',
      'errors.integer',
      'errors.decimal',
      'errors.finnishBusinessId',
      'errors.iban',
      'errors.bic',
      'errors.table-has-one-invalid-value',
      'errors.table-misses-one-value',
    ])

    await clearTranslationMarks(page)
    await cells.nth(1).fill('y')
    await shoot(['errors.table-has-many-invalid-values'])

    await clearTranslationMarks(page)
    await cells.nth(0).fill('')
    await cells.nth(1).fill('')
    await shoot(['errors.table-misses-many-values'])

    await cells.nth(0).fill('1')
    await cells.nth(1).fill('2')
    // workaround: the budget's "Yhteensä" header comes first on the page, hide it so the helper finds the table's sum row
    const otherSumTitles = page
      .getByText(fiText('form.table-field.sum-title')!, { exact: true })
      .and(page.locator(':not(#tr-table *)'))
    await otherSumTitles.evaluateAll((els) => els.forEach((e) => (e.style.visibility = 'hidden')))
    await shoot(['form.table-field.sum-title'])
    await otherSumTitles.evaluateAll((els) => els.forEach((e) => (e.style.visibility = '')))
    for (const id of ['tr-email', 'tr-money', 'tr-integer', 'tr-decimal', 'tr-business-id']) {
      await page.locator(`#${id}`).fill('')
    }
  })

  await test.step('preview', async () => {
    const previewUrl = await page.locator('a.preview-link').getAttribute('href')
    const previewPage = await page.context().newPage()
    await previewPage.goto(new URL(previewUrl!, page.url()).href)
    await previewPage.locator('div.soresu-preview').waitFor()
    for (const key of ['form.attachment.attachmentMissing', 'form.preview']) {
      manifest[key] ??= await shootTranslation(previewPage, key, fiText(key)!)
    }
    await previewPage.close()
  })

  await test.step('submitted hakemus', async () => {
    await hakijaPage.fillApplication(answers, null)
    await hakijaPage.fillMuutoshakemusEnabledHakemus(answers)
    await shootHovered('#topbar #form-controls button#submit', 'form.savehelp-hakemus')
    await hakijaPage.submitApplication()
    await page.mouse.move(0, 0)
    await page.reload()
    await hakijaPage.form.muutoshakuEnabledFields.projectName.waitFor()
    await shoot(['form.submitted-hakemus', 'misc.register-number'])
  })

  await test.step('closed haku', async () => {
    const hakemusUrl = page.url()
    const haunTiedotPage = await new HakujenHallintaPage(page).navigate(avustushakuID)
    await haunTiedotPage.closeAvustushakuByChangingEndDateToPast()
    await page.goto(hakemusUrl)
    await page.locator('#avustushaku-has-ended-message').waitFor()
    await shoot(['form.has-ended'])
    await hakijaPage.navigate(avustushakuID, 'fi')
    await page.locator('#haku-not-open').waitFor()
    await shoot(['login.notopen'])
  })

  for (const key of keys) manifest[key] ??= null
  writeTranslationManifest('hakemus-form-more', manifest)
})
