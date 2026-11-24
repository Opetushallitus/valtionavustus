import { expect, Page } from '@playwright/test'
import { submittedHakemusTest as test } from '../../fixtures/muutoshakemusTest'
import { JotpaTest } from '../../fixtures/JotpaTest'
import koulutusosioLomake from '../../fixtures/koulutusosio.hakulomake.json'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { TEST_Y_TUNNUS } from '../../utils/constants'
import {
  clearTranslationMarks,
  fiText,
  shootTranslation,
  writeTranslationManifest,
} from '../../utils/translationScreenshots'

const budgetKeys = [
  'form.budget.financingNeededTotal',
  'form.budget.minSelfFinancingNeeded',
  'form.budget.selfFinancingAmount',
  'form.budget.ophFinancingAmount',
  'form.budget.jotpaFinancingAmount',
  'form.budget.selfFinancingPercentage',
  'form.budget.ophFinancingPercentage',
  'form.budget.jotpaFinancingPercentage',
  'misc.check-numbers',
]
const traineeDayKeys = [
  'form.trainee-day-calculator.scope-type',
  'form.trainee-day-calculator.scope',
  'form.trainee-day-calculator.person-count',
  'form.trainee-day-calculator.op',
  'form.trainee-day-calculator.kp',
  'form.trainee-day-calculator.scope-total',
  'form.trainee-day-calculator.person-count-total',
]
const errorKeys = [
  'errors.insufficient-self-financing',
  'errors.negative-budget',
  'errors.negative-trayneeday-total',
]
const allKeys = [...budgetKeys, ...traineeDayKeys, ...errorKeys, 'form.savehelp-hakemus-jotpa']

// both tests fill one manifest, serial keeps them in the same worker
test.describe.configure({ mode: 'serial' })
const manifest: Record<string, string | null> = {}

async function shoot(page: Page, keys: string[]) {
  for (const key of keys) manifest[key] ??= await shootTranslation(page, key, fiText(key)!)
}

function writeManifest() {
  writeTranslationManifest('budget', {
    ...Object.fromEntries(allKeys.map((k) => [k, null])),
    ...manifest,
  })
}

async function openHakemus(page: Page, hakemusUrl: string) {
  const hakijaPage = HakijaAvustusHakuPage(page)
  await page.goto(hakemusUrl)
  // y-tunnus modal blocks the form
  await hakijaPage.fillInBusinessId(TEST_Y_TUNNUS)
  await page.locator('.budget-summary').waitFor()
  return hakijaPage
}

async function shootErrorSummary(page: Page) {
  // validation errors of untouched fields only show up after a reload
  await page.reload()
  await page.locator('#form-error-summary a.validation-errors-summary').click()
  await shoot(page, errorKeys)
}

// default haku requires 0 % self financing, which never triggers insufficient-self-financing
const ophTest = test.extend({
  avustushakuID: async ({ page, hakuProps, hakulomake, userCache }, use) => {
    expect(userCache).toBeDefined()
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const { avustushakuID } = await hakujenHallintaPage.createHakuWithLomakeJson(
      hakulomake,
      hakuProps
    )
    const haunTiedotPage = await hakujenHallintaPage.commonHakujenHallinta.switchToHaunTiedotTab()
    await page.locator('#haku-self-financing-percentage').fill('20')
    await hakujenHallintaPage.waitForSave()
    await haunTiedotPage.publishAvustushaku()
    await use(avustushakuID)
  },
})

ophTest('translation screenshots: OPH budget', async ({ page, startedHakemus }) => {
  const hakijaPage = await openHakemus(page, startedHakemus.hakemusUrl)
  // empty budget shows "Tarkista luvut" in the summary
  await shoot(page, budgetKeys)
  await shootErrorSummary(page)

  // full budget without self financing breaks the haku's minimum self financing percentage
  await page.locator('[id="personnel-costs-row.amount"]').fill('10000')
  await page.locator('[id="personnel-costs-row.description"]').fill('Palkat')
  await page.locator('#self-financing-amount').fill('0')
  await hakijaPage.waitForEditSaved()
  await clearTranslationMarks(page)
  await shoot(page, budgetKeys)
  await shootErrorSummary(page)

  writeManifest()
})

const jotpaKoulutusosioTest = JotpaTest.extend({
  hakulomake: JSON.stringify(koulutusosioLomake),
})

jotpaKoulutusosioTest(
  'translation screenshots: Jotpa budget and trainee-day calculator',
  async ({ page, startedHakemus }) => {
    await openHakemus(page, startedHakemus.hakemusUrl)
    await shoot(page, [...budgetKeys, ...traineeDayKeys])

    // help text is a tooltip of the submit button
    await page.locator('#form-controls .form-control').first().hover()
    await shoot(page, ['form.savehelp-hakemus-jotpa'])

    // a zero total is only validated once the calculator has been edited
    await page
      .locator('[id="koulutusosiot.koulutusosio-1.koulutettavapaivat.person-count"]')
      .fill('5')
    await HakijaAvustusHakuPage(page).waitForEditSaved()
    await shootErrorSummary(page)

    writeManifest()
  }
)
