import { Page } from '@playwright/test'
import { Response } from 'playwright-core'

export default function SelvitysTab(page: Page) {
  const titleSelector = '[name="applicant-info-label-fi"]'
  const locators = {
    tapahtumaloki: page.locator('div.tapahtumaloki'),
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
    await page.fill(titleSelector, title)
    await save()
  }

  async function getSelvitysTitleFi() {
    return await page.textContent(titleSelector)
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

  return {
    getSelvitysTitleFi,
    setSelvitysTitleFi,
    openFormPreviewFi,
    openFormPreviewSv,
    ...locators,
  }
}
