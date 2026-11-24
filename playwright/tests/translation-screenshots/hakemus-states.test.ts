import { Page } from '@playwright/test'
import { muutoshakemusTest as test } from '../../fixtures/muutoshakemusTest'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { RefusePage } from '../../pages/hakija/refuse-page'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { getMuutoshakemusEmails, getRefuseUrlFromEmail } from '../../utils/emails'
import {
  fiText,
  shootTranslation,
  writeTranslationManifest,
} from '../../utils/translationScreenshots'

// null on purpose:
// misc.pending_change_request, misc.officer_edit: no usage in va-hakija/web or soresu-form/web
// form.edit-contacts-title, form.open-edit-contacts-button: OpenContactsEdit can't render, VaForm
//   shows MuutoshakemusComponent whenever showOpenContactsEditButton is true
const keys = [
  'form.change-request-response',
  'form.change-request-response-help',
  'misc.pending_change_request',
  'form.virkailija-edit-submit',
  'form.virkailija-edit-submit-help',
  'misc.officer_edit',
  'form.edit-contacts-title',
  'form.open-edit-contacts-button',
  'form.grant-refuse-title',
  'form.grant-refuse-info',
  'form.grant-refuse-accept',
  'form.grant-refuse-send',
  'form.grant-refuse-sent',
  'form.grant-refuse-token-invalid',
]

const manifest: Record<string, string | null> = {}

async function shoot(page: Page, keys: string[]) {
  for (const key of keys) manifest[key] ??= await shootTranslation(page, key, fiText(key)!)
}

// help texts are CSS tooltips that only show while the button wrapper is hovered
async function shootButtonAndTooltip(page: Page, buttonId: string, key: string) {
  await shoot(page, [key])
  await page.locator('.soresu-tooltip', { has: page.locator(`#${buttonId}`) }).hover()
  await shoot(page, [`${key}-help`])
}

test.describe.configure({ mode: 'serial' })
test.setTimeout(180_000)

test.afterAll(() => {
  for (const key of keys) manifest[key] ??= null
  writeTranslationManifest('hakemus-states', manifest)
})

test('translation screenshots: officer edit and change request', async ({
  page,
  closedAvustushaku,
  submittedHakemus: { userKey },
}) => {
  const avustushakuID = closedAvustushaku.id
  const arviointiPage = new HakemustenArviointiPage(page)

  await arviointiPage.navigateToLatestHakemusArviointi(avustushakuID)
  const officerEditPage = await arviointiPage.openHakemusEditPage()
  await officerEditPage.page.locator('#virkailija-edit-submit').waitFor()
  await shootButtonAndTooltip(
    officerEditPage.page,
    'virkailija-edit-submit',
    'form.virkailija-edit-submit'
  )
  // the change request can't be made while the hakemus is in officer_edit
  await officerEditPage.selectMaakuntaFromDropdown('Itä-Uusimaa')
  await officerEditPage.submitOfficerEdit()
  await officerEditPage.page.close()

  await arviointiPage.navigateToLatestHakemusArviointi(avustushakuID)
  await arviointiPage.createChangeRequest()
  const hakijaPage = HakijaAvustusHakuPage(page)
  await hakijaPage.navigateToExistingHakemusPage(avustushakuID, userKey)
  await page.locator('#change-request-response').waitFor()
  await shootButtonAndTooltip(page, 'change-request-response', 'form.change-request-response')
})

test('translation screenshots: grant refuse', async ({ page, acceptedHakemus: { hakemusID } }) => {
  const refuseUrl = getRefuseUrlFromEmail((await getMuutoshakemusEmails(hakemusID))[0])
  const refusePage = RefusePage(page)

  // a token that doesn't match the hakemus looks the same as one invalidated by maksatus
  const badTokenUrl = new URL(refuseUrl)
  badTokenUrl.searchParams.set('token', 'invalid-token')
  await page.goto(badTokenUrl.toString())
  await page.getByText(fiText('form.grant-refuse-token-invalid')!).waitFor()
  await shoot(page, ['form.grant-refuse-token-invalid'])

  await page.goto(refuseUrl)
  await refusePage.locators.agreeButton.waitFor()
  await shoot(page, [
    'form.grant-refuse-title',
    'form.grant-refuse-info',
    'form.grant-refuse-accept',
    'form.grant-refuse-send',
  ])
  await refusePage.refuseGrant()
  await shoot(page, ['form.grant-refuse-sent'])
})
