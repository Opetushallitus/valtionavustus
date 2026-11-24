import { Page, expect } from '@playwright/test'
import moment from 'moment'
import { budjettimuutoshakemusTest } from '../../fixtures/budjettimuutoshakemusTest'
import { HakijaMuutoshakemusPage } from '../../pages/hakija/hakijaMuutoshakemusPage'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { Budget, BudgetAmount } from '../../utils/budget'
import { HAKIJA_URL } from '../../utils/constants'
import { setPaatosTemplateVersion } from '../../utils/hakemus'
import { PaatosStatus } from '../../utils/types'
import {
  fiText,
  shootTranslation,
  writeTranslationManifest,
} from '../../utils/translationScreenshots'
import { translationsFi } from '../../../soresu-form/web/va/i18n/translations'

const flatten = (o: object, prefix: string): string[] =>
  Object.entries(o).flatMap(([k, v]) =>
    typeof v === 'object' ? flatten(v, `${prefix}.${k}`) : [`${prefix}.${k}`]
  )
const allMuutoshakemusKeys = flatten(translationsFi.muutoshakemus, 'muutoshakemus')
// muutoshakemus.status.* only labels the virkailija hakemus list; short words like "Hyväksytty" would hit other text
const muutoshakemusKeys = allMuutoshakemusKeys.filter((k) => !k.startsWith('muutoshakemus.status.'))
// "Lisätietoja" would substring-match "Lisätietoja päätöksestä", so shoot these on the version 1 päätös only
const version1Keys = ['muutoshakemus.paatos.lisatietoja', 'muutoshakemus.paatos.paatoksenTekija']
// keys rendered by MuutoshakemusValues on the hakija muutoshakemus page; the rest are päätös page keys,
// shot only there so that e.g. paatos.hanke ("Hanke") does not hit the hakemus "Hanke" label
const muutoshakemusPageKeys = muutoshakemusKeys.filter(
  (k) =>
    /^muutoshakemus\.(\w+ProjectEndDate|\w+Change|applicantReasoning)$/.test(k) ||
    /^muutoshakemus\.paatos\.(processed|paatosDokumentti|budjetti|kayttoaika|sisaltoJaToimitustapa)$/.test(
      k
    ) ||
    /^muutoshakemus\.paatos\.paatos-[^.]+\.status\./.test(k)
)
const paatosPageKeys = muutoshakemusKeys.filter((k) => !version1Keys.includes(k))
const yhteystiedotKeys = flatten(translationsFi.yhteystiedot, 'yhteystiedot')

const budget: Budget = {
  amount: {
    personnel: '300',
    material: '420',
    equipment: '1337',
    'service-purchase': '5318008',
    rent: '69',
    steamship: '0',
    other: '9000',
  },
  description: {
    personnel: 'Henkilöstö',
    material: 'Materiaalit',
    equipment: 'Laitteet',
    'service-purchase': 'Palvelut',
    rent: 'Vuokra',
    steamship: 'Ei matkoja',
    other: 'Muut',
  },
  selfFinancing: '1',
}

// every muutoshakemus budget keeps the original total
const haettuBudget: BudgetAmount = {
  personnel: '301',
  material: '421',
  equipment: '1338',
  'service-purchase': '5318007',
  rent: '68',
  steamship: '0',
  other: '8999',
}
const muutettuBudget: BudgetAmount = {
  personnel: '1301',
  material: '1421',
  equipment: '2338',
  'service-purchase': '5312007',
  rent: '1068',
  steamship: '1000',
  other: '9999',
}

type Decision = { jatkoaika: PaatosStatus; talousarvio: PaatosStatus; sisalto: PaatosStatus }
// the first three cover every osio status, the last two the all-accepted and all-rejected vakioperustelut
const decisions: Decision[] = [
  { jatkoaika: 'rejected', talousarvio: 'accepted_with_changes', sisalto: 'accepted' },
  { jatkoaika: 'accepted_with_changes', talousarvio: 'rejected', sisalto: 'accepted_with_changes' },
  { jatkoaika: 'accepted', talousarvio: 'accepted', sisalto: 'rejected' },
  { jatkoaika: 'accepted', talousarvio: 'accepted', sisalto: 'accepted' },
  { jatkoaika: 'rejected', talousarvio: 'rejected', sisalto: 'rejected' },
]

const test = budjettimuutoshakemusTest.extend({
  budget,
  acceptedBudget: budget,
})

test.setTimeout(400_000)

test('translation screenshots: hakija muutoshakemus päätös and yhteystiedot', async ({
  page,
  avustushakuID,
  acceptedHakemus: { hakemusID, userKey },
}) => {
  const manifest: Record<string, string | null> = {}
  const shootAll = async (keys: string[]) => {
    for (const key of keys) {
      const text = fiText(key)
      if (text) manifest[key] ??= await shootTranslation(page, key, text)
    }
  }
  // the title is rendered as "Muutoshakemus <date>", so match that instead of the bare word
  const shootTitle = async () => {
    // local workaround: the title is a stretched flex item and the helper's band around a tall element
    // centers it in the viewport, leaving its top-aligned text off screen
    await page
      .getByTestId('existing-muutoshakemus-title')
      .evaluateAll((els) => els.forEach((e) => (e.style.alignSelf = 'flex-start')))
    manifest['muutoshakemus.title'] ??= await shootTranslation(
      page,
      'muutoshakemus.title',
      `${translationsFi.muutoshakemus.title} ${moment().format('D.M.YYYY')}`
    )
  }

  const hakijaPage = new HakijaMuutoshakemusPage(page)
  const arviointiPage = new HakemustenArviointiPage(page)

  for (const [i, decision] of decisions.entries()) {
    await hakijaPage.navigate(hakemusID)
    await hakijaPage.fillJatkoaikaValues({
      jatkoaika: moment()
        .add(i + 1, 'months')
        .locale('fi'),
      jatkoaikaPerustelu: 'Tarvitaan lisää aikaa',
    })
    await hakijaPage.clickHaenMuutostaTaloudenKayttosuunnitelmaan()
    await hakijaPage.fillTalousarvioValues(haettuBudget, 'Budjettia pitää muuttaa')
    await hakijaPage.clickHaenSisaltomuutosta()
    await hakijaPage.fillSisaltomuutosPerustelut('Sisältöä pitää muuttaa')
    await hakijaPage.sendMuutoshakemus(true)

    if (i === 0) {
      await hakijaPage.navigate(hakemusID)
      await shootTitle()
      await shootAll(muutoshakemusPageKeys)
    }

    const tab = await arviointiPage.navigateToLatestMuutoshakemus(avustushakuID, hakemusID)
    await tab.setMuutoshakemusJatkoaikaDecision(
      decision.jatkoaika,
      decision.jatkoaika === 'accepted_with_changes' ? '01.01.2099' : undefined
    )
    await tab.setMuutoshakemusBudgetDecision(
      decision.talousarvio,
      decision.talousarvio === 'accepted_with_changes' ? muutettuBudget : undefined
    )
    await tab.setMuutoshakemusSisaltoDecision(decision.sisalto)
    await tab.selectVakioperusteluInFinnish()
    // there is no vakioperustelu for a mix of accepted and rejected osios
    if (!(await page.locator('#reason').inputValue()))
      await tab.writePerustelu('Osittain hyväksytty')
    await tab.saveMuutoshakemus()
  }

  // all three decided muutoshakemukset are listed with their osio decisions
  await hakijaPage.navigate(hakemusID)
  await shootTitle()
  await shootAll(muutoshakemusPageKeys)
  const paatosLinks = await page
    .locator('a.muutoshakemus__paatos-link')
    .evaluateAll((links) => links.map((a) => (a as HTMLAnchorElement).href))
  expect(paatosLinks).toHaveLength(decisions.length)

  const shootPaatos = async (link: string, keys: string[]) => {
    await page.goto(link)
    await expect(page.getByTestId('muutoshakemus-paatos-title')).toBeVisible()
    await shootAll(keys)
  }
  for (const link of paatosLinks) await shootPaatos(link, paatosPageKeys)
  // template version 1 has Hyväksyjä/Lisätietoja instead of Ratkaisija ja esittelijä
  await setPaatosTemplateVersion(page.request, hakemusID, 1)
  await shootPaatos(paatosLinks[0], version1Keys)

  const yhteystiedotUrl = `${HAKIJA_URL}/avustushaku/${avustushakuID}/hakemus/${userKey}/yhteystiedot`
  const yhteystiedotApi = '**/api/avustushaku/*/hakemus/*/yhteystiedot'
  const shootYhteystiedot = async (state: RegExp | string) => {
    await page.goto(yhteystiedotUrl)
    await expect(page.locator('main')).toContainText(state)
    await shootAll(yhteystiedotKeys)
  }

  await shootYhteystiedot(translationsFi.yhteystiedot.title)

  await page.route(yhteystiedotApi, async (route) => {
    const json = await (await route.fetch()).json()
    json.contact = null
    json.avustushaku['operational-unit-code'] = '6600105300'
    await route.fulfill({ json })
  })
  await shootYhteystiedot(translationsFi.yhteystiedot.noContact)
  await page.unrouteAll()

  await page.route(yhteystiedotApi, (route) => route.fulfill({ status: 404, body: '' }))
  await shootYhteystiedot(translationsFi.yhteystiedot.notFound)
  await page.unrouteAll()

  await page.route(yhteystiedotApi, (route) => route.fulfill({ status: 500, body: '' }))
  await shootYhteystiedot(translationsFi.yhteystiedot.error)
  await page.unrouteAll()

  await shootLoading(page, yhteystiedotApi, yhteystiedotUrl, async () => {
    await shootAll(['yhteystiedot.loading'])
  })

  for (const key of [...allMuutoshakemusKeys, ...yhteystiedotKeys]) manifest[key] ??= null
  writeTranslationManifest('muutoshakemus-paatos', manifest)
})

/** Holds the API response until `shoot` has captured the Suspense fallback. */
async function shootLoading(page: Page, api: string, url: string, shoot: () => Promise<void>) {
  let release = () => {}
  const released = new Promise<void>((r) => (release = r))
  await page.route(api, async (route) => {
    await released
    await route.continue()
  })
  await page.goto(url)
  await expect(page.getByRole('status')).toBeVisible()
  await shoot()
  release()
  await page.unrouteAll({ behavior: 'ignoreErrors' })
}
