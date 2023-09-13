import { expect, Locator, Page } from '@playwright/test'
import SelvitysTab from './CommonSelvitysPage'
import moment from 'moment/moment'

function createLoppuselvitysPhaseLocators(baseLocator: Locator) {
  return {
    taydennyspyynto: baseLocator.getByRole('button', { name: 'Täydennyspyyntö' }),
    accept: baseLocator.getByRole('button', { name: 'Hyväksy' }),
    confirmAcceptance: baseLocator.getByRole('button', {
      name: 'Vahvista hyväksyntä',
    }),
    cancelTaydennyspyynto: baseLocator.getByRole('button', { name: 'Peru täydennyspyyntö' }),
  }
}

export const LoppuselvitysPage = (page: Page) => {
  const locators = {
    linkToForm: page.locator('a', { hasText: 'Linkki lomakkeelle' }),
    previewFi: page.getByTestId('form-preview-fi'),

    warning: page.locator('#selvitys-not-sent-warning'),
    asiatarkastettu: page.getByTestId('loppuselvitys-tarkastus').first(),
    taloustarkastettu: page.getByTestId('loppuselvitys-tarkastus').nth(1),
    asiatarkastus: createLoppuselvitysPhaseLocators(
      page.getByTestId('loppuselvitys-asiatarkastus')
    ),
    taloustarkastus: createLoppuselvitysPhaseLocators(
      page.getByTestId('loppuselvitys-taloustarkastus')
    ),
  }

  async function goToPreview() {
    const [previewPage] = await Promise.all([
      page.context().waitForEvent('page'),
      await locators.previewFi.click(),
    ])
    await previewPage.bringToFront()
    await previewPage.waitForLoadState()
    return previewPage
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
    await locators.asiatarkastus.accept.click()
    await locators.asiatarkastus.confirmAcceptance.click()
    await expect(locators.asiatarkastettu).toBeVisible()
    await expect(locators.asiatarkastettu).toContainText('Asiatarkastettu')
    await expect(locators.asiatarkastettu).toContainText('_ valtionavustus')
    await expect(locators.asiatarkastettu).toContainText([moment().format('DD.MM.YYYY')])
  }

  async function taloustarkastaLoppuselvitys() {
    await expect(locators.taloustarkastettu).toBeHidden()
    await expect(locators.taloustarkastus.confirmAcceptance).toBeHidden()
    await locators.taloustarkastus.accept.click()
    await locators.taloustarkastus.confirmAcceptance.click()
    await expect(locators.taloustarkastus.confirmAcceptance).toBeHidden()
    await expect(locators.taloustarkastettu).toBeVisible()
    await expect(locators.taloustarkastettu).toContainText('Hyväksytty')
  }

  async function openLoppuselvitysForm() {
    const [hakijaSelvitysFormPage] = await Promise.all([
      page.context().waitForEvent('page'),
      await page.getByRole('link', { name: 'Linkki lomakkeelle' }).click(),
    ])
    await hakijaSelvitysFormPage.bringToFront()
    await hakijaSelvitysFormPage.waitForLoadState()
    return hakijaSelvitysFormPage
  }

  return {
    page,
    locators,
    getSelvitysFormUrl,
    goToPreview,
    sendLoppuselvitys,
    asiatarkastaLoppuselvitys,
    taloustarkastaLoppuselvitys,
    ensureMuistutusViestiEmailRecipientsContain,
    openLoppuselvitysForm,
    ...SelvitysTab(page, 'loppu'),
  }
}
