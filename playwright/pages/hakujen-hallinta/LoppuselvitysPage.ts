import { expect, Page } from '@playwright/test'
import SelvitysTab from './CommonSelvitysPage'

export const LoppuselvitysPage = (page: Page) => {
  const locators = {
    linkToForm: page.locator('a', { hasText: 'Linkki lomakkeelle' }),
    warning: page.locator('#selvitys-not-sent-warning'),
    taloustarkastusButton: page.getByRole('button', {
      name: 'Hyväksy taloustarkastus ja lähetä viesti',
    }),
    taloustarkastettu: page.getByRole('heading', {
      name: 'Taloustarkastettu ja lähetetty hakijalle',
    }),
  }

  async function checkMuistutusViestiEmailRecipients(recipients: string[]) {
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

  async function asiatarkastaLoppuselvitys(huomiot: string) {
    await page.getByPlaceholder('Kirjaa tähän mahdolliset huomiot asiatarkastuksesta').fill(huomiot)
    await page
      .getByRole('button', { name: 'Hyväksy asiatarkastus ja lähetä taloustarkastukseen' })
      .click()
  }

  async function taloustarkastaLoppuselvitys() {
    await expect(locators.taloustarkastettu).toBeHidden()
    await locators.taloustarkastusButton.click()
    await expect(locators.taloustarkastusButton).toBeHidden()
    await expect(locators.taloustarkastettu).toBeVisible()
  }

  return {
    locators,
    getSelvitysFormUrl,
    sendLoppuselvitys,
    asiatarkastaLoppuselvitys,
    taloustarkastaLoppuselvitys,
    checkMuistutusViestiEmailRecipients,
    ...SelvitysTab(page, 'loppu'),
  }
}
