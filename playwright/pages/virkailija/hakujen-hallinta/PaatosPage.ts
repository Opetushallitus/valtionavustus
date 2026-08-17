import { expect, Page } from '@playwright/test'
import { navigate } from '../../../utils/navigate'
import * as common from './CommonHakujenHallintaPage'
import { CommonHakujenHallintaPage } from './CommonHakujenHallintaPage'
import { getAcceptedPäätösEmails } from '../../../utils/emails'
import { expectToBeDefined } from '../../../utils/util'
import { VIRKAILIJA_URL } from '../../../utils/constants'

export function PaatosPage(page: Page) {
  const datePicker = 'div.datepicker input'
  const alkamisPaiva = page.getByTestId('hankkeen-alkamispaiva')
  const label = '[data-test-id="label"]'
  const paattymisPaiva = page.getByTestId('hankkeen-paattymispaiva')
  const valiselvitysPaiva = page.getByTestId('valiselvityksen-aikaraja')
  const loppuselvitysPaiva = page.getByTestId('loppuselvityksen-aikaraja')

  const locators = {
    sendPaatokset: (amount: number = 1) => page.locator(`text="Lähetä ${amount} päätöstä"`),
    hankkeenAlkamisPaiva: alkamisPaiva.locator(datePicker),
    hankkeenAlkamisPaivaLabel: alkamisPaiva.locator(label),
    hankkeenPaattymisPaiva: paattymisPaiva.locator(datePicker),
    hankkeenPaattymisPaivaLabel: paattymisPaiva.locator(label),
    taustaa: page.locator('[id="decision.taustaa.fi"]'),
    kayttotarkoitus: page.locator('[id="decision.kayttotarkoitus.fi"]'),
    selvitysvelvollisuus: page.locator('[id="decision.selvitysvelvollisuus.fi"]'),
    decisionEditor: page.locator('.decision-editor'),
    confirmSending: page.locator('text="Vahvista lähetys"'),
    paatosSendError: page.locator('#päätös-send-error'),
    paatosSentToEmails: page.getByTestId('sent-emails'),
    yleisOhjeCheckbox: page.locator('label').locator('text="Valtionavustusten yleisohje"'),
    jotpaOhjeCheckbox: page.locator('input[value="jotpa_vakioehdot"]'),
    yleisOhjeLiite: page.locator('[data-liite=va_yleisohje]'),
    oikaisuvaatimus3aCheckbox: page.locator(
      'input[value="3a_oikaisuvaatimusosoitus_valtionavustuslaki"]'
    ),
    oikaisuvaatimus3aVersion2026: page.locator(
      '[data-liite="3a_oikaisuvaatimusosoitus_valtionavustuslaki"][value="_2026"]'
    ),
    pakoteOhjeCheckbox: page.locator(
      'text=Pakotteiden huomioon ottaminen valtionavustustoiminnassa'
    ),
    pakoteOhjeInput: page.getByRole('checkbox', {
      name: 'Pakotteiden huomioon ottaminen valtionavustustoiminnassa',
    }),
    maksuaika: page.locator('[id="decision.maksu.fi"]'),
    lisatekstiDefault: page.locator('[id="decision.myonteinenlisateksti.fi"]'),
    lisatekstiAmmatillinenKoulutus: page.locator(
      '[id="decision.myonteinenlisateksti-Ammatillinen_koulutus.fi"]'
    ),
    paatosUpdatedAt: page.locator('#paatosUpdatedAt'),
    paatosLukittuIlmoitus: page.getByTestId('paatos-lukittu-ilmoitus'),
    valiselvitysDate: valiselvitysPaiva.locator(datePicker),
    loppuselvitysDate: loppuselvitysPaiva.locator(datePicker),
    decisionDate: page.locator('[id="decision.date"]'),
  }

  async function navigateTo(avustushakuID: number) {
    await navigate(page, `/admin/decision/?avustushaku=${avustushakuID}`)
  }

  async function navigateToLatestHakijaPaatos(hakemusID: number) {
    const emails = await getAcceptedPäätösEmails(hakemusID)
    const latestEmail = [...emails].pop()
    expectToBeDefined(latestEmail)
    const url = latestEmail.formatted.match(/https?:\/\/.*\/paatos\/avustushaku\/.*/)?.[0]
    expectToBeDefined(url)
    await page.goto(url)
  }

  async function resendPaatokset(amount: number = 1) {
    await page.locator(`text=Lähetä ${amount} päätöstä uudelleen`).click()
    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/api/paatos/resendall/') && resp.status() === 200,
        { timeout: 30_000 }
      ),
      page.locator('text=Vahvista päätösten uudelleenlähetys').click(),
    ])
    await expect(page.locator('text=Päätökset lähetetty uudelleen')).toBeVisible()
  }

  async function recreatePaatokset() {
    await page.locator('text=Luo päätökset uudelleen').click()
    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/api/paatos/regenerate/') && resp.status() === 200,
        { timeout: 30_000 }
      ),
      page.locator('text=Vahvista päätösten luominen').click(),
    ])
    await expect(page.locator('text=Päätökset luotu uudelleen')).toBeVisible()
  }

  async function sendPaatos(amount = 1) {
    await locators.sendPaatokset(amount).click()
    const [sendPaatoksetResponse] = await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/api/paatos/sendall/') && resp.request().method() === 'POST',
        {
          timeout: 30_000,
        }
      ),
      locators.confirmSending.click(),
    ])
    expect(
      sendPaatoksetResponse.ok(),
      `Expected /api/paatos/sendall/ to return success status, got ${sendPaatoksetResponse.status()}`
    ).toBeTruthy()
    await expect(page.locator('.tapahtumaloki .entry')).toHaveCount(1, { timeout: 30_000 })
  }

  async function isRatkaistu(avustushakuID: number) {
    const response = await page.request.get(`${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}`, {
      failOnStatusCode: true,
    })
    const { avustushaku } = await response.json()
    return avustushaku.status === 'resolved'
  }

  /**
   * Päätöseditori on lukittu, kun haku on tilassa Ratkaistu. Muokkausta varten haku
   * palautetaan Julkaistu-tilaan ja ratkaistaan muokkauksen jälkeen uudelleen.
   */
  async function editPaatos(avustushakuID: number, edit: () => Promise<void>) {
    const common = CommonHakujenHallintaPage(page)
    const lukittu = await isRatkaistu(avustushakuID)
    if (lukittu) {
      await navigateTo(avustushakuID)
      await common.waitForAvustushakuReady()
      const haunTiedotPage = await common.switchToHaunTiedotTab()
      await haunTiedotPage.publishAvustushaku()
    }
    await navigateTo(avustushakuID)
    await common.waitForAvustushakuReady()
    await edit()
    await common.waitForSave()
    if (lukittu) {
      const haunTiedotPage = await common.switchToHaunTiedotTab()
      await haunTiedotPage.resolveAvustushaku()
      await navigateTo(avustushakuID)
      await common.waitForAvustushakuReady()
    }
  }

  async function setLoppuselvitysDate(value: string) {
    await page.fill('[data-test-id="loppuselvityksen-aikaraja"] div.datepicker input', value)
    await page.keyboard.press('Tab')
  }

  async function setValiselvitysDate(value: string) {
    await page.fill('[data-test-id="valiselvityksen-aikaraja"] div.datepicker input', value)
    await page.keyboard.press('Tab')
  }

  return {
    common: CommonHakujenHallintaPage(page),
    locators,
    navigateTo,
    navigateToLatestHakijaPaatos,
    editPaatos,
    sendPaatos,
    recreatePaatokset,
    resendPaatokset,
    setLoppuselvitysDate,
    setValiselvitysDate,
    waitForSave: () => common.waitForSave(page),
  }
}
