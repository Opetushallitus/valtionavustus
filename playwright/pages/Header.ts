import { Page } from '@playwright/test'
import { HaunTiedotPage } from './hakujen-hallinta/HaunTiedotPage'

export const Header = (page: Page) => {
  const link = page.locator('a')
  const locators = {
    header: {
      hakujenHallinta: link.getByText('Hakujen hallinta'),
      hakemustenArviointi: link.getByText('Hakemusten arviointi'),
      koodienhallinta: link.getByText('VA-koodienhallinta'),
      haku: link.getByText('Haku'),
    },
  }
  const switchToHakujenHallinta = async () => {
    await locators.header.hakujenHallinta.click()
    return HaunTiedotPage(page)
  }
  return {
    locators,
    switchToHakujenHallinta,
  }
}
