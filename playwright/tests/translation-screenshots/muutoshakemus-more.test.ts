import { Page } from '@playwright/test'
import { budjettimuutoshakemusTest } from '../../fixtures/budjettimuutoshakemusTest'
import { yhteishankeMuutoshakemusTest } from '../../fixtures/yhteishankeMuutoshakemusTest'
import { avustushakuWithOrganizationRoleHakulomake } from '../../fixtures/avustushakuWithOrganizationRole'
import { HakijaMuutoshakemusPage } from '../../pages/hakija/hakijaMuutoshakemusPage'
import { getLinkToMuutoshakemusFromSentEmails } from '../../utils/emails'
import { submitMuutoshakemusAndExpectSuccess } from '../../utils/yhteishanke'
import { translationsFi } from '../../../soresu-form/web/va/i18n/translations'
import {
  clearTranslationMarks,
  fiText,
  shootTranslation,
  writeTranslationManifest,
} from '../../utils/translationScreenshots'

const budget = translationsFi.muutosTaloudenKayttosuunnitelmaan.budget
// function-valued keys have no fiText, so their text is given here
const textOverrides: Record<string, string> = {
  'muutosTaloudenKayttosuunnitelmaan.budget.budgetOriginalTitle(isAccepted=false)':
    budget.budgetOriginalTitle(false),
  'muutosTaloudenKayttosuunnitelmaan.budget.budgetChangeTitle(isAccepted=false)':
    budget.budgetChangeTitle(false),
  'formErrors.talousarvioSum': 'Loppusumman on oltava',
}

// null on purpose: logo.alt and loadingDecision are only on the muutoshakemus päätös page,
// email.paatos.status.* and the isAccepted=true / acceptedChanges texts need a decided muutoshakemus,
// sisaltomuutos.sectionTitle is unused
const keys = [
  'hakemus',
  'waitingForDecision',
  'loading',
  'loadingDecision',
  'savedNotification',
  'sentNotification',
  'errorNotification',
  'logo.alt',
  'calendar.moveToday',
  'applicationEdit.title',
  'applicationEdit.reasoning',
  'contactPersonEdit.haku',
  'contactPersonEdit.registerNumberTitle',
  'contactPersonEdit.hanke',
  'contactPersonEdit.email',
  'contactPersonEdit.phone',
  'contactPersonEdit.trustedContactName',
  'contactPersonEdit.trustedContactEmail',
  'contactPersonEdit.trustedContactPhone',
  'contactPersonEdit.updateYhteishankeContacts',
  'contactPersonEdit.updateYhteishankeOrganizations',
  'contactPersonEdit.addYhteishankeOrganization',
  'contactPersonEdit.removeYhteishankeOrganization',
  'contactPersonEdit.resetYhteishankeOrganizations',
  'contactPersonEdit.yhteishankeOrganizationName',
  'contactPersonEdit.yhteishankeContactPerson',
  'contactPersonEdit.yhteishankeEmail',
  'contactPersonEdit.yhteishankeRole',
  'kayttoajanPidennys.existingExpirationDateTitle',
  'kayttoajanPidennys.newExpirationDateTitle',
  'sisaltomuutos.sectionTitle',
  'sisaltomuutos.title',
  'sisaltomuutos.appliedChange',
  'sisaltomuutos.acceptedChanges',
  'sisaltomuutos.yhteishankeOsapuolimuutokset',
  'sisaltomuutos.yhteishankeOsapuoliPerustelutTitle',
  'muutosTaloudenKayttosuunnitelmaan.checkboxTitle',
  'muutosTaloudenKayttosuunnitelmaan.currentBudget',
  'muutosTaloudenKayttosuunnitelmaan.modifiedBudget',
  'muutosTaloudenKayttosuunnitelmaan.expensesTotal',
  'muutosTaloudenKayttosuunnitelmaan.budget.budgetOriginalTitle(isAccepted=true)',
  'muutosTaloudenKayttosuunnitelmaan.budget.budgetOriginalTitle(isAccepted=false)',
  'muutosTaloudenKayttosuunnitelmaan.budget.budgetChangeTitle(isAccepted=true)',
  'muutosTaloudenKayttosuunnitelmaan.budget.budgetChangeTitle(isAccepted=false)',
  'muutosTaloudenKayttosuunnitelmaan.applicantReasoning',
  'formErrors.required',
  'formErrors.email',
  'formErrors.haettuKayttoajanPaattymispaiva',
  'formErrors.talousarvioSum',
  'email.paatos.status.sent',
  'email.paatos.status.pending',
]

// both tests run in the same worker, each writes what has been found so far
const manifest: Record<string, string | null> = {}

async function shoot(page: Page, shotKeys: string[]) {
  for (const key of shotKeys) {
    const text = textOverrides[key] ?? fiText(key)
    if (text) manifest[key] ??= await shootTranslation(page, key, text)
  }
}

function writeManifest() {
  writeTranslationManifest('muutoshakemus-more', {
    ...Object.fromEntries(keys.map((k) => [k, null])),
    ...manifest,
  })
}

async function saveContactDetails(page: Page) {
  await Promise.all([
    page.waitForResponse(
      (r) => r.request().method() === 'POST' && /\/api\/muutoshakemus\//.test(r.url())
    ),
    page.locator('#send-muutospyynto-button').click(),
  ])
}

// the text is transparent until the colour class lands 400 ms later, then fades out after 5 s
async function notificationShown(page: Page, type: 'success' | 'error') {
  await page.locator(`div.notification-container div.auto-hide.${type}`).waitFor()
}

budjettimuutoshakemusTest.setTimeout(300_000)

budjettimuutoshakemusTest(
  'translation screenshots: hakija muutoshakemus form with budget',
  async ({ page, acceptedHakemus }) => {
    try {
      const muutoshakemusPage = new HakijaMuutoshakemusPage(page)
      const link = await getLinkToMuutoshakemusFromSentEmails(acceptedHakemus.hakemusID)

      // the loading text only flashes by, so hold back the API responses
      await page.route('**/api/avustushaku/**', async (route) => {
        await new Promise((r) => setTimeout(r, 2000))
        await route.continue()
      })
      await page.goto(link)
      await page.getByText(fiText('loading')!).waitFor()
      await shoot(page, ['loading'])
      await page.unrouteAll({ behavior: 'wait' })
      await page.locator('h1[id=topic]').waitFor()
      await page.locator('[data-test-id=avustushaku-name]').waitFor()

      await shoot(page, [
        'hakemus',
        'contactPersonEdit.haku',
        'contactPersonEdit.registerNumberTitle',
        'contactPersonEdit.hanke',
        'contactPersonEdit.email',
        'contactPersonEdit.phone',
        'contactPersonEdit.trustedContactName',
        'contactPersonEdit.trustedContactEmail',
        'contactPersonEdit.trustedContactPhone',
        'applicationEdit.title',
        'muutosTaloudenKayttosuunnitelmaan.checkboxTitle',
      ])

      const { contactPersonPhoneNumber, contactPersonEmail } = muutoshakemusPage.locators()
      await contactPersonPhoneNumber.fill('0401234567')
      await saveContactDetails(page)
      await notificationShown(page, 'success')
      await shoot(page, ['savedNotification'])

      await page.route('**/api/muutoshakemus/**', (route) =>
        route.request().method() === 'POST' ? route.fulfill({ status: 500 }) : route.continue()
      )
      await contactPersonPhoneNumber.fill('0407654321')
      await saveContactDetails(page)
      await notificationShown(page, 'error')
      // the notification div is reused from savedNotification
      await clearTranslationMarks(page)
      await shoot(page, ['errorNotification'])
      await page.unrouteAll({ behavior: 'wait' })

      // only the email field renders its error message
      await contactPersonEmail.fill('')
      await contactPersonEmail.blur()
      await shoot(page, ['formErrors.required'])
      await contactPersonEmail.fill('ei-sahkoposti')
      await contactPersonEmail.blur()
      await clearTranslationMarks(page)
      await shoot(page, ['formErrors.email'])

      // drop the broken contact details before applying for changes
      await page.reload()
      await page.locator('[data-test-id=avustushaku-name]').waitFor()

      await muutoshakemusPage.clickHaenSisaltomuutosta()
      await shoot(page, ['sisaltomuutos.title'])
      await muutoshakemusPage.fillSisaltomuutosPerustelut('Muutetaan toteutustapaa')

      await muutoshakemusPage.clickHaenKayttoajanPidennysta()
      await shoot(page, [
        'kayttoajanPidennys.existingExpirationDateTitle',
        'kayttoajanPidennys.newExpirationDateTitle',
        'applicationEdit.reasoning',
      ])
      const { calendar } = muutoshakemusPage.locators()
      await calendar.button.click()
      await shoot(page, ['calendar.moveToday'])
      await calendar.button.click()
      await calendar.input.fill('01.01.2000')
      // the datepicker parses typed text only on blur
      await calendar.input.press('Tab')
      await page
        .getByText(fiText('formErrors.haettuKayttoajanPaattymispaiva')!)
        .waitFor({ timeout: 5000 })
        .catch(() => {})
      await shoot(page, ['formErrors.haettuKayttoajanPaattymispaiva'])
      // only the budget is applied for, so its "Hakijan perustelut" is the only one after sending
      await muutoshakemusPage.clickHaenKayttoajanPidennysta()

      await muutoshakemusPage.clickHaenMuutostaTaloudenKayttosuunnitelmaan()
      await shoot(page, [
        'muutosTaloudenKayttosuunnitelmaan.currentBudget',
        'muutosTaloudenKayttosuunnitelmaan.modifiedBudget',
        'muutosTaloudenKayttosuunnitelmaan.expensesTotal',
      ])
      await muutoshakemusPage.fillTalousarvioValues({ personnel: '200001' })
      await shoot(page, ['formErrors.talousarvioSum'])
      await muutoshakemusPage.fillTalousarvioValues(
        { material: '2999' },
        'Siirretään rahaa henkilöstömenoihin'
      )

      await muutoshakemusPage.clickSendMuutoshakemus()
      await notificationShown(page, 'success')
      await shoot(page, ['sentNotification'])

      await muutoshakemusPage.existingMuutoshakemusLocator.waitFor()
      // the title column is stretched to the section height, centering it hides the text under the top bar
      await page
        .getByTestId('existing-muutoshakemus-title')
        .evaluate((e) => (e.style.alignSelf = 'flex-start'))
      await shoot(page, [
        'waitingForDecision',
        'sisaltomuutos.appliedChange',
        'muutosTaloudenKayttosuunnitelmaan.budget.budgetOriginalTitle(isAccepted=false)',
        'muutosTaloudenKayttosuunnitelmaan.budget.budgetChangeTitle(isAccepted=false)',
        'muutosTaloudenKayttosuunnitelmaan.applicantReasoning',
      ])
    } finally {
      writeManifest()
    }
  }
)

yhteishankeMuutoshakemusTest.use({
  yhteishankeHakulomake: avustushakuWithOrganizationRoleHakulomake(),
})
yhteishankeMuutoshakemusTest.setTimeout(300_000)

yhteishankeMuutoshakemusTest(
  'translation screenshots: hakija muutoshakemus form for yhteishanke',
  async ({ page, acceptedYhteishankeHakemus }) => {
    try {
      const muutoshakemusPage = new HakijaMuutoshakemusPage(page)
      await muutoshakemusPage.navigate(acceptedYhteishankeHakemus.hakemusID)
      await shoot(page, [
        'contactPersonEdit.updateYhteishankeContacts',
        'contactPersonEdit.updateYhteishankeOrganizations',
      ])

      await page.getByTestId('checkbox-update-yhteishanke-organizations').check()
      // the main contact person label has the same text, hide it so the osapuoli label gets shot
      const mainContactLabel = muutoshakemusPage.locators().contactPersonLabel
      await mainContactLabel.evaluate((e) => (e.style.visibility = 'hidden'))
      await shoot(page, [
        'contactPersonEdit.yhteishankeOrganizationName',
        'contactPersonEdit.yhteishankeContactPerson',
        'contactPersonEdit.yhteishankeEmail',
      ])
      await mainContactLabel.evaluate((e) => (e.style.visibility = ''))
      await page.getByTestId('checkbox-update-yhteishanke-organizations').uncheck()

      await page.locator('#checkbox-haenYhteishankkeenOsapuolimuutosta').check()
      await shoot(page, [
        'contactPersonEdit.addYhteishankeOrganization',
        'contactPersonEdit.resetYhteishankeOrganizations',
        'contactPersonEdit.removeYhteishankeOrganization',
        'contactPersonEdit.yhteishankeRole',
        'sisaltomuutos.yhteishankeOsapuoliPerustelutTitle',
      ])

      await page.getByTestId('remove-yhteishanke-organization-change-2').click()
      await page.getByTestId('add-yhteishanke-organization-change').click()
      await page.locator('#yhteishankkeen-osapuolimuutokset-2-name').fill('Uusi Osapuoli Oy')
      await page.locator('#yhteishankkeen-osapuolimuutokset-2-contactperson').fill('Uusi Henkilö')
      await page.locator('#yhteishankkeen-osapuolimuutokset-2-email').fill('uusi@example.com')
      await page.locator('#yhteishankkeen-osapuolimuutokset-2-role').fill('Uuden rooli')
      await page.locator('#perustelut-yhteishankeOsapuoliPerustelut').fill('Vaihdetaan osapuoli')
      await submitMuutoshakemusAndExpectSuccess(page)

      await muutoshakemusPage.existingMuutoshakemusLocator.waitFor()
      await shoot(page, ['sisaltomuutos.yhteishankeOsapuolimuutokset'])
    } finally {
      writeManifest()
    }
  }
)
