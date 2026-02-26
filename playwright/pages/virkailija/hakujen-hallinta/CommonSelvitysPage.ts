import { expect, Page } from '@playwright/test'
import { Response } from 'playwright-core'
import { navigate } from '../../../utils/navigate'
import { saveStatusTestId } from './CommonHakujenHallintaPage'

type SelvitysType = 'vali' | 'loppu'

export default function SelvitysTab(page: Page, type: SelvitysType) {
  const umlautType = type === 'vali' ? 'väli' : 'loppu'

  const locators = {
    form: page.locator('.form-json-editor textarea'),
    saveFormButton: page.getByRole('button', { name: 'Tallenna' }),
    tapahtumaloki: page.locator('div.tapahtumaloki'),
    linkToHakemus: page.locator('text="Linkki lomakkeelle"'),
    warning: page.locator('#selvitys-not-sent-warning'),
    title: page.locator('[name="applicant-info-label-fi"]'),
  }

  async function save() {
    await Promise.all([
      page.click('text="Tallenna"'),
      page.waitForResponse(
        (response) => response.status() === 200 && isSelvitysSavedResponse(response)
      ),
    ])
  }

  function isSelvitysSavedResponse(response: Response) {
    if (response.request().method() !== 'POST') return false
    return (
      response.url().endsWith('/selvitysform/valiselvitys') ||
      response.url().endsWith('/selvitysform/loppuselvitys')
    )
  }

  async function setSelvitysTitleFi(title: string) {
    await locators.title.fill(title)
    await save()
  }

  function getSelvitysTitleFi() {
    return locators.title
  }

  async function openFormPreview(testId: string) {
    const [previewPage] = await Promise.all([
      page.context().waitForEvent('page'),
      await page.getByTestId(testId).click(),
    ])
    await previewPage.bringToFront()
    return previewPage
  }

  async function openFormPreviewFi() {
    return await openFormPreview('form-preview-fi')
  }

  async function openFormPreviewSv() {
    return await openFormPreview('form-preview-sv')
  }

  async function acceptSelvitys() {
    await page.getByText('Lähetä viesti').click()
    await expect(page.getByText(`Lähetetty ${umlautType}selvityksen hyväksyntä`)).toBeVisible()
  }

  async function acceptInstallment(installmentSum: string) {
    const moneyField = `[data-test-id="hakemus-details-${type}selvitys"] [class="payment-money-column"] input`
    await page.locator(moneyField).fill(installmentSum)
    await page.getByText(/Lisää.* erä maksatuslistaan/i).click()
    await waitForSave()
  }

  async function waitForSave() {
    await expect(page.locator('text=Kaikki tiedot tallennettu')).toBeVisible()
  }

  async function navigateToValiselvitysTab(avustushakuID: number, hakemusID: number) {
    return await navigateToSelvitysTab(avustushakuID, hakemusID, 'vali')
  }

  async function navigateToLoppuselvitysTab(avustushakuID: number, hakemusID: number) {
    return await navigateToSelvitysTab(avustushakuID, hakemusID, 'loppu')
  }

  async function navigateToSelvitysTab(
    avustushakuID: number,
    hakemusID: number,
    type: SelvitysType
  ) {
    await navigate(page, `/avustushaku/${avustushakuID}/hakemus/${hakemusID}/${type}selvitys/`)
    await expect(page.getByTestId(`hakemus-details-${type}selvitys`)).toBeVisible()
    return SelvitysTab(page, type)
  }

  async function sendSelvitysPyynnot(expectedAmount = 1) {
    await page.getByText(`Lähetä ${umlautType}selvityspyynnöt`).click()
    await expect(page.getByText(`Lähetetty ${expectedAmount} viestiä`)).toBeVisible()
  }

  async function waitFormToBeLoaded() {
    await expect(locators.form).toContainText('{')
  }

  async function changeLomakeJson(lomakeJson: string) {
    await waitFormToBeLoaded()
    await expect(locators.saveFormButton).toBeDisabled()
    await locators.form.fill(lomakeJson)
    await expect(locators.saveFormButton).toBeEnabled()
  }

  async function saveForm() {
    const savedSuccessfully = page
      .getByTestId(saveStatusTestId)
      .locator('text=Kaikki tiedot tallennettu')
    await expect(savedSuccessfully).toBeHidden()
    await locators.saveFormButton.click()
    await expect(savedSuccessfully).toBeVisible()
  }

  return {
    getSelvitysTitleFi,
    setSelvitysTitleFi,
    changeLomakeJson,
    openFormPreviewFi,
    openFormPreviewSv,
    acceptSelvitys,
    acceptInstallment,
    waitForSave,
    navigateToValiselvitysTab,
    navigateToLoppuselvitysTab,
    sendSelvitysPyynnot,
    saveForm,
    ...locators,
  }
}
