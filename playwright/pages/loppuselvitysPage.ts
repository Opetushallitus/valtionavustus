import { expect, Page } from '@playwright/test'

import { navigate } from '../utils/navigate'

export function LoppuselvitysPage(page: Page) {
  const locators = {
    linkToForm: page.locator('a', { hasText: 'Linkki lomakkeelle' }),
    warning: page.locator('#selvitys-not-sent-warning'),
  }

  async function navigateToLoppuselvitysTab(avustushakuID: number, hakemusID: number) {
    await navigate(page, `/avustushaku/${avustushakuID}/hakemus/${hakemusID}/loppuselvitys/`)
    await expect(page.getByTestId('hakemus-details-loppuselvitys')).toBeVisible()
  }

  async function getSelvitysFormUrl() {
    const formUrl = await locators.linkToForm.getAttribute('href')
    if (!formUrl) {
      throw Error(`loppuselvitys form url not found on ${page.url()}`)
    }
    return formUrl
  }

  return {
    navigateToLoppuselvitysTab,
    getSelvitysFormUrl,
    ...locators,
  }
}
