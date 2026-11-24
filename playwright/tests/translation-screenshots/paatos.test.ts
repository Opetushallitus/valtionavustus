import { Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import translationsJson from '../../../server/resources/public/translations.json'
import { muutoshakemusTest } from '../../fixtures/muutoshakemusTest'
import { budjettimuutoshakemusTest } from '../../fixtures/budjettimuutoshakemusTest'
import { createJotpaCodes } from '../../fixtures/JotpaTest'
import { defaultValues } from '../../fixtures/defaultValues'
import { HakijaPaatosPage } from '../../pages/hakija/HakijaPaatosPage'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { PaatosPage } from '../../pages/virkailija/hakujen-hallinta/PaatosPage'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import {
  fiText,
  shootTranslation,
  translationScreenshotDir,
  writeTranslationManifest,
} from '../../utils/translationScreenshots'

const keys = Object.keys(translationsJson.paatos).map((k) => `paatos.${k}`)

// Never shot: unused, virkailija-only (decision editor prefixes) or states not set up here.
// Short unused texts like "Summa" would otherwise substring-match unrelated cells.
const skipped = new Set(
  [
    'lisatietoja-antaa',
    'hanke',
    'menot',
    'yhteensa',
    'rahoitus',
    'summa',
    'laajuus',
    'ratkaisija',
    'esittelija',
    'kp',
    // heading of paatos template v1 only; new hakus use v2 "Lisätietoja päätöksestä"
    'lisatietoja',
  ].map((k) => `paatos.${k}`)
)

// Texts that would otherwise substring-match the wrong element: koulutusosio cells read "99 op",
// and "Hakija" is also the start of "Hakijan omarahoitusosuus"
const textOverrides: Record<string, string> = { 'paatos.op': '99 op', 'paatos.hakija': 'Hakija:' }

// The variants run as separate tests (and workers after a failure), so merge into the file on disk.
function saveManifest(found: Record<string, string | null>) {
  const file = path.join(translationScreenshotDir, 'paatos.json')
  const previous = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {}
  writeTranslationManifest(
    'paatos',
    Object.fromEntries(keys.map((k) => [k, found[k] ?? previous[k] ?? null]))
  )
}

// Jotpa and OPH variants share texts (e.g. "Avustuksen käyttötarkoitus"), so each run shoots only its own keys.
async function shootPaatos(page: Page, hakemusID: number, jotpa = false) {
  await HakijaPaatosPage(page).navigate(hakemusID)
  await page.getByTestId('paatos-title').waitFor()
  const found: Record<string, string | null> = {}
  for (const key of keys) {
    const text = textOverrides[key] ?? fiText(key)
    if (text && !skipped.has(key) && key.endsWith('-jotpa') === jotpa)
      found[key] = await shootTranslation(page, key, text)
  }
  saveManifest(found)
}

// Optional decision sections only render when the virkailija has written them before resolving.
async function fillDecisionTexts(page: Page, avustushakuID: number) {
  const paatosPage = PaatosPage(page)
  await paatosPage.navigateTo(avustushakuID)
  await paatosPage.common.waitForAvustushakuReady()
  for (const id of [
    'sovelletutsaannokset',
    'kayttooikeudet',
    'kayttotarkoitus',
    'selvitysvelvollisuus',
    'hyvaksyminen',
  ]) {
    await page.locator(`[id="decision.${id}.fi"]`).fill(`Esimerkkiteksti ${id}`)
    await paatosPage.waitForSave()
  }
}

const selvitysDeadlines = { valiselvitysDeadline: '12.6.2030', loppuselvitysDeadline: '12.12.2030' }

const erityisavustusTest = muutoshakemusTest.extend({
  hakuProps: async ({ hakuProps }, use) => use({ ...hakuProps, ...selvitysDeadlines }),
  submittedHakemus: async ({ submittedHakemus, page, avustushakuID }, use) => {
    await fillDecisionTexts(page, avustushakuID)
    await use(submittedHakemus)
  },
  // perustelut is disabled until the haku has closed
  closedAvustushaku: async ({ closedAvustushaku, page, answers }, use) => {
    const arviointiPage = new HakemustenArviointiPage(page)
    await arviointiPage.navigate(closedAvustushaku.id)
    await arviointiPage.selectHakemusFromList(answers.projectName!)
    // save status reads "saved" before the debounced save starts, and page load fires its own arvio POST
    await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().endsWith('/arvio') && !!r.request().postData()?.includes('Esimerkkiperustelut')
      ),
      arviointiPage.fillPaatoksenPerustelut('Esimerkkiperustelut'),
    ])
    await use(closedAvustushaku)
  },
})

const kayttosuunnitelmaTest = budjettimuutoshakemusTest.extend({
  hakuProps: async ({ hakuProps }, use) => use({ ...hakuProps, ...selvitysDeadlines }),
  submittedHakemus: async ({ submittedHakemus, page, avustushakuID }, use) => {
    await fillDecisionTexts(page, avustushakuID)
    await use(submittedHakemus)
  },
})

const jotpaCodes = {
  codes: async ({ page }: { page: Page }, use: (c: any) => Promise<void>) =>
    use(await createJotpaCodes(page)),
}

const yleisavustusTest = erityisavustusTest.extend({
  avustushakuID: async ({ page, hakuProps, userCache, hakulomake }, use, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 40_000)
    void userCache
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const { avustushakuID } = await hakujenHallintaPage.createHakuWithLomakeJson(
      hakulomake,
      hakuProps
    )
    const haunTiedotPage = await hakujenHallintaPage.commonHakujenHallinta.switchToHaunTiedotTab()
    await page.click('label[for="set-haku-type-yleisavustus"]')
    await hakujenHallintaPage.waitForSave()
    await haunTiedotPage.publishAvustushaku()
    await use(avustushakuID)
  },
})

// file-level: applies to every test object extended from the same base
defaultValues.setTimeout(240_000)

kayttosuunnitelmaTest(
  'paatos: accepted erityisavustus with kayttosuunnitelma',
  async ({ page, acceptedHakemus }) => {
    await shootPaatos(page, acceptedHakemus.hakemusID)
  }
)

erityisavustusTest('paatos: rejected erityisavustus', async ({ page, rejectedHakemus }) => {
  await shootPaatos(page, rejectedHakemus.hakemusID)
})

kayttosuunnitelmaTest.extend(jotpaCodes)(
  'paatos: accepted jotpa',
  async ({ page, acceptedHakemus }) => {
    await shootPaatos(page, acceptedHakemus.hakemusID, true)
  }
)

erityisavustusTest.extend(jotpaCodes)(
  'paatos: rejected jotpa',
  async ({ page, rejectedHakemus }) => {
    await shootPaatos(page, rejectedHakemus.hakemusID, true)
  }
)

yleisavustusTest('paatos: accepted yleisavustus', async ({ page, acceptedHakemus }) => {
  await shootPaatos(page, acceptedHakemus.hakemusID)
})

yleisavustusTest('paatos: rejected yleisavustus', async ({ page, rejectedHakemus }) => {
  await shootPaatos(page, rejectedHakemus.hakemusID)
})

const koulutusosioTest = defaultValues.extend<{ avustushakuID: number }>({
  avustushakuID: async ({ page, hakuProps, userCache }, use, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 40_000)
    void userCache
    await use(await new HakujenHallintaPage(page).createKoulutusasteHaku(hakuProps))
  },
})

koulutusosioTest('paatos: accepted koulutusosio', async ({ page, avustushakuID, answers }) => {
  const projectName = answers.projectName!
  const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
  await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang)
  await hakijaAvustusHakuPage.fillKoulutusosioHakemus(avustushakuID, answers, 'opintopiste')
  await hakijaAvustusHakuPage.submitApplication()

  const hakujenHallintaPage = new HakujenHallintaPage(page)
  const haunTiedotPage = await hakujenHallintaPage.navigate(avustushakuID)
  await haunTiedotPage.closeAvustushakuByChangingEndDateToPast()
  const arviointiPage = new HakemustenArviointiPage(page)
  await arviointiPage.navigate(avustushakuID)
  await arviointiPage.selectHakemusFromList(projectName)
  const hakemusID = await arviointiPage.getHakemusID()
  await arviointiPage.closeHakemusDetails()
  await arviointiPage.selectValmistelijaForHakemus(hakemusID, '_ valtionavustus')
  await arviointiPage.selectHakemusFromList(projectName)
  await arviointiPage.arviointiTabLocators().budget.fill('1000')
  await page.click("#arviointi-tab label[for='set-arvio-status-accepted']")
  await arviointiPage.waitForSave()

  const resolvedTiedot = await arviointiPage.header.switchToHakujenHallinta()
  await resolvedTiedot.resolveAvustushaku()
  const paatosPage = await hakujenHallintaPage.commonHakujenHallinta.switchToPaatosTab()
  await paatosPage.sendPaatos()

  await shootPaatos(page, hakemusID)
})
