import { expect, Page } from '@playwright/test'
import { navigate } from '../../../utils/navigate'
import * as common from './CommonHakujenHallintaPage'
import { CommonHakujenHallintaPage } from './CommonHakujenHallintaPage'
import { getAcceptedPäätösEmails } from '../../../utils/emails'
import { expectToBeDefined } from '../../../utils/util'

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
    pakoteOhjeCheckbox: page.locator(
      'text=Pakotteiden huomioon ottaminen valtionavustustoiminnassa'
    ),
    lisatekstiDefault: page.locator('[id="decision.myonteinenlisateksti.fi"]'),
    lisatekstiAmmatillinenKoulutus: page.locator(
      '[id="decision.myonteinenlisateksti-Ammatillinen_koulutus.fi"]'
    ),
    paatosUpdatedAt: page.locator('#paatosUpdatedAt'),
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
    await page.locator('text=Vahvista päätösten uudelleenlähetys').click()
    await expect(page.locator('text=Päätökset lähetetty uudelleen')).toBeVisible()
  }

  async function recreatePaatokset() {
    await page.locator('text=Luo päätökset uudelleen').click()
    await page.locator('text=Vahvista päätösten luominen').click()
    await expect(page.locator('text=Päätökset luotu uudelleen')).toBeVisible()
  }

  async function sendPaatos(amount = 1) {
    await locators.sendPaatokset(amount).click()
    const sendallResponse = page.waitForResponse(new RegExp('/api/paatos/sendall/\\d+$'), {
      timeout: 30_000,
    })
    const tapahtumalokiResponse = page.waitForResponse(
      new RegExp('/api/avustushaku/\\d+/tapahtumaloki/paatoksen_lahetys$'),
      { timeout: 30_000 }
    )
    await locators.confirmSending.click()
    await sendallResponse
    await tapahtumalokiResponse
    await expect(page.locator('.tapahtumaloki .entry')).toHaveCount(1)
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
    sendPaatos,
    recreatePaatokset,
    resendPaatokset,
    setLoppuselvitysDate,
    setValiselvitysDate,
    waitForSave: () => common.waitForSave(page),
  }
}
