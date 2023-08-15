import { expect, Page } from '@playwright/test'
import SelvitysTab from './CommonSelvitysPage'

export const LoppuselvitysPage = (page: Page) => {
  const taydennyspyynto = page.getByText('Täydennyspyyntö')
  const locators = {
    linkToForm: page.locator('a', { hasText: 'Linkki lomakkeelle' }),
    warning: page.locator('#selvitys-not-sent-warning'),
    acceptTaloustarkastus: page
      .getByTestId('taydennyspyynto-taloustarkastus')
      .getByRole('button', { name: 'Hyväksy' }),
    confirmTaloustarkastusButton: page.getByRole('button', {
      name: 'Hyväksy taloustarkastus ja lähetä viesti',
    }),
    taloustarkastettu: page.getByTestId('loppuselvitys-tarkastus').nth(1),
    asiatarkastettu: page.getByTestId('loppuselvitys-tarkastus').first(),
    acceptAsiatarkastus: page
      .getByTestId('taydennyspyynto-asiatarkastus')
      .getByRole('button', { name: 'Hyväksy' }),
    confirmAsiatarkastus: page
      .getByTestId('taydennyspyynto-asiatarkastus')
      .getByRole('button', { name: 'Vahvista hyväksyntä' }),
    taydennyspyyntoAsiatarkastus: taydennyspyynto.nth(0),
    taydennyspyyntoTaloustarkastus: taydennyspyynto.nth(1),
  }

  async function ensureMuistutusViestiEmailRecipientsContain(recipients: string[]) {
    await page.getByRole('button', { name: 'Kirjoita' }).click()
    await Promise.all(
      recipients.map((recipent, i) => {
        expect(page.locator(`[data-test-id="muistutusviesti-receiver-${i}"]`)).toHaveValue(recipent)
      })
    )
  }

  async function getSelvitysFormUrl() {
    const formUrl = await locators.linkToForm.getAttribute('href')
    if (!formUrl) {
      throw Error(`loppuselvitys form url not found on ${page.url()}`)
    }
    return formUrl
  }
  async function sendLoppuselvitys(expectedAmount = 1) {
    await page.click('text="Lähetä loppuselvityspyynnöt"')
    await page.waitForSelector(`text="Lähetetty ${expectedAmount} viestiä"`)
  }

  async function asiatarkastaLoppuselvitys(_: string) {
    await expect(locators.asiatarkastettu).toBeHidden()
    await locators.acceptAsiatarkastus.click()
    await locators.confirmAsiatarkastus.click()
    await expect(locators.asiatarkastettu).toBeVisible()
    await expect(locators.asiatarkastettu).toContainText('Asiatarkastettu')
  }

  async function taloustarkastaLoppuselvitys() {
    await expect(locators.taloustarkastettu).toBeHidden()
    await expect(locators.confirmTaloustarkastusButton).toBeHidden()
    await locators.acceptTaloustarkastus.click()
    await locators.confirmTaloustarkastusButton.click()
    await expect(locators.confirmTaloustarkastusButton).toBeHidden()
    await expect(locators.taloustarkastettu).toBeVisible()
    await expect(locators.taloustarkastettu).toContainText('Hyväksytty')
  }

  return {
    locators,
    getSelvitysFormUrl,
    sendLoppuselvitys,
    asiatarkastaLoppuselvitys,
    taloustarkastaLoppuselvitys,
    ensureMuistutusViestiEmailRecipientsContain,
    ...SelvitysTab(page, 'loppu'),
  }
}
