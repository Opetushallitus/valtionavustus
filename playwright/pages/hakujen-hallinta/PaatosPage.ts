import { expect, Page } from '@playwright/test'
import { navigate } from '../../utils/navigate'
import * as common from './common'

export function PaatosPage(page: Page) {
  const datePicker = 'div.datepicker input'
  const alkamisPaiva = page.getByTestId('hankkeen-alkamispaiva')
  const label = '[data-test-id="label"]'
  const paattymisPaiva = page.getByTestId('hankkeen-paattymispaiva')

  const locators = {
    sendPaatokset: (amount: number = 1) => page.locator(`text="Lähetä ${amount} päätöstä"`),
    hankkeenAlkamisPaiva: alkamisPaiva.locator(datePicker),
    hankkeenAlkamisPaivaLabel: alkamisPaiva.locator(label),
    hankkeenPaattymisPaiva: paattymisPaiva.locator(datePicker),
    hankkeenPaattymisPaivaLabel: paattymisPaiva.locator(label),
    confirmSending: page.locator('text="Vahvista lähetys"'),
    paatosSendError: page.locator('#päätös-send-error'),
    erityisavustusEhdotCheckbox: page
      .locator('label')
      .locator('text=Eritysavustukseen liittyvät ehdot ja rajoitukset'),
    yleisavustusEhdotCheckbox: page
      .locator('label')
      .locator('text=Yleisavustukseen liittyvät ehdot ja rajoitukset'),
    yleisOhjeCheckbox: page.locator('label').locator('text="Valtionavustusten yleisohje"'),
    yleisOhjeLiite: page.locator('[data-liite=va_yleisohje]'),
    pakoteOhjeCheckbox: page
      .locator('label')
      .locator(
        'text=Venäjän hyökkäyssotaan liittyvien pakotteiden huomioon ottaminen valtionavustustoiminnassa'
      ),
    lisatekstiDefault: page.locator('[id="decision.myonteinenlisateksti.fi"]'),
    lisatekstiAmmatillinenKoulutus: page.locator(
      '[id="decision.myonteinenlisateksti-Ammatillinen_koulutus.fi"]'
    ),
    paatosUpdatedAt: page.locator('#paatosUpdatedAt'),
  }

  async function navigateTo(avustushakuID: number) {
    await navigate(page, `/admin/decision/?avustushaku=${avustushakuID}`)
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
    await Promise.all([
      page.waitForResponse(new RegExp('/api/paatos/sendall/\\d+$')),
      locators.confirmSending.click(),
    ])
    const tapahtumaloki = await page.waitForSelector('.tapahtumaloki')
    const logEntryCount = await tapahtumaloki.evaluate((e) => e.querySelectorAll('.entry').length)
    expect(logEntryCount).toEqual(1)
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
    locators,
    navigateTo,
    sendPaatos,
    recreatePaatokset,
    resendPaatokset,
    setLoppuselvitysDate,
    setValiselvitysDate,
    waitForSave: () => common.waitForSave(page),
  }
}
