import { expect } from '@playwright/test'

import { muutoshakemusTest } from '../../fixtures/muutoshakemusTest'
import avustushaku417LyhennettyHakulomake from './ophy-654-avustushaku-417.hakulomake.json'
import avustushaku417Loppuselvityslomake from './ophy-654-avustushaku-417.loppuselvitys.json'
import avustushaku417Valiselvityslomake from './ophy-654-avustushaku-417.valiselvitys.json'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'

muutoshakemusTest.use({
  hakulomake: JSON.stringify(avustushaku417LyhennettyHakulomake),
  loppuselvitysForm: JSON.stringify(avustushaku417Loppuselvityslomake),
  valiselvitysForm: JSON.stringify(avustushaku417Valiselvityslomake),
  businessId: null,
  filledHakemus: async ({ answers, businessId, startedHakemus, page }, use) => {
    const { hakemusUrl } = startedHakemus
    await page.goto(hakemusUrl)
    const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
    await hakijaAvustusHakuPage.fillApplication(answers, businessId)
    await use({ hakemusUrl })
  },
})

muutoshakemusTest(
  `OPHY-654 regression: avustushaku with very simple budget shouldn't break seuranta page`,
  async ({ acceptedHakemus, avustushakuID, page }) => {
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    await hakemustenArviointiPage.navigateToHakemusArviointi(
      avustushakuID,
      acceptedHakemus.hakemusID
    )

    await hakemustenArviointiPage.tabs().seuranta.click()
    const { grantedTotal } = hakemustenArviointiPage.seurantaTabLocators()
    await expect(grantedTotal).toBeVisible()
  }
)
