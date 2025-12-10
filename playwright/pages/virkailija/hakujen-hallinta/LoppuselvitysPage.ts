import { expect, Page } from '@playwright/test'
import SelvitysTab from './CommonSelvitysPage'
import moment from 'moment/moment'

export const LoppuselvitysPage = (page: Page) => {
  const asiatarkastus = page.getByTestId('loppuselvitys-asiatarkastus')
  const taloustarkastus = page.getByTestId('loppuselvitys-taloustarkastus')
  const asiatarkastuksenTaydennyspyynto = page.getByTestId(
    'loppuselvitys-taydennyspyynto-asiatarkastus-email'
  )
  const locators = {
    linkToForm: page.locator('a', { hasText: 'Linkki lomakkeelle' }),
    previewFi: page.getByTestId('form-preview-fi'),
    warning: page.locator('#selvitys-not-sent-warning'),
    asiatarkastettu: page.getByTestId('loppuselvitys-tarkastus').first(),
    taloustarkastettu: page.getByTestId('loppuselvitys-tarkastus').nth(1),
    asiatarkastuksenTaydennyspyynto: {
      emailSubjectInputField: asiatarkastuksenTaydennyspyynto.getByTestId(
        'loppuselvitys-taydennyspyynto-asiatarkastus-email-subject'
      ),
      emailBodyInputField: asiatarkastuksenTaydennyspyynto.getByTestId(
        'loppuselvitys-taydennyspyynto-asiatarkastus-email-content'
      ),
      emailSendButton: asiatarkastuksenTaydennyspyynto.getByTestId(
        'loppuselvitys-taydennyspyynto-asiatarkastus-submit'
      ),
    },
    asiatarkastus: {
      taydennyspyynto: asiatarkastus.getByRole('button', { name: 'Täydennyspyyntö' }),
      cancelTaydennyspyynto: asiatarkastus.getByRole('button', { name: 'Peru täydennyspyyntö' }),
      acceptMessage: page.getByPlaceholder('Kirjaa tähän mahdolliset huomiot asiatarkastuksesta'),
      confirmAcceptance: page.getByRole('button', {
        name: 'Hyväksy asiatarkastus ja lähetä taloustarkastukseen',
      }),
    },
    taloustarkastus: {
      taydennyspyynto: taloustarkastus.getByRole('button', { name: 'Täydennyspyyntö' }),
      cancelTaydennyspyynto: taloustarkastus.getByRole('button', { name: 'Peru täydennyspyyntö' }),
      accept: taloustarkastus.getByRole('button', { name: 'Hyväksy' }),
      confirmAcceptance: page.getByRole('button', {
        name: 'Hyväksy ja lähetä viesti',
      }),
    },
    muistutusviesti: {
      open: page.getByRole('button', { name: 'Kirjoita' }),
      subject: page.getByTestId('muistutusviesti-email-subject'),
      header: page.locator('pre').first(),
      content: page.getByTestId('muistutusviesti-email-content'),
      footer: page.locator('pre').last(),
      preview: page.getByRole('button', { name: 'Esikatsele' }),
      send: page.getByRole('button', { name: 'Lähetä muistutusviesti' }),
      addReceiver: page.getByTestId('muistutusviesti-add-receiver'),
      nthReceiver: (nth: number) => page.getByTestId(`muistutusviesti-receiver-${nth}`),
    },
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
      recipients.map(async (recipent, i) => {
        await expect(page.locator(`[data-test-id="muistutusviesti-receiver-${i}"]`)).toHaveValue(
          recipent
        )
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
    await expect(page.getByText(`Lähetetty ${expectedAmount} viestiä`)).toBeVisible()
  }

  async function teeLoppuselvityksenTäydennyspyyntö({
    subject,
    body,
  }: {
    subject: string
    body: string
  }) {
    await locators.asiatarkastus.taydennyspyynto.click()
    await locators.asiatarkastuksenTaydennyspyynto.emailSubjectInputField.fill(subject)
    await locators.asiatarkastuksenTaydennyspyynto.emailBodyInputField.fill(body)
    await locators.asiatarkastuksenTaydennyspyynto.emailSendButton.click()
  }

  async function asiatarkastaLoppuselvitys(message: string) {
    await expect(locators.asiatarkastettu).toBeHidden()
    await expect(locators.asiatarkastus.confirmAcceptance).toBeDisabled()
    await locators.asiatarkastus.acceptMessage.fill(message)
    await locators.asiatarkastus.confirmAcceptance.click()
    await expect(locators.asiatarkastettu).toBeVisible()
    await expect(locators.asiatarkastettu).toContainText('Asiatarkastettu')
    await expect(locators.asiatarkastettu).toContainText('_ valtionavustus')
    await expect(locators.asiatarkastettu).toContainText([moment().format('DD.MM.YYYY')])
    const messageLocator = page.getByText(message, { exact: true })
    await expect(messageLocator).not.toBeVisible()
    await locators.asiatarkastettu.click()
    await expect(messageLocator).toBeVisible()
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
    teeLoppuselvityksenTäydennyspyyntö,
    asiatarkastaLoppuselvitys,
    taloustarkastaLoppuselvitys,
    ensureMuistutusViestiEmailRecipientsContain,
    openLoppuselvitysForm,
    ...SelvitysTab(page, 'loppu'),
  }
}
