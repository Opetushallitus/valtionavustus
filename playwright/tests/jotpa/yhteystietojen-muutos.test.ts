import { expect } from '@playwright/test'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { getHakemusTokenAndRegisterNumber } from '../../utils/emails'
import { JotpaTest, SwedishJotpaTest } from '../../fixtures/JotpaTest'

JotpaTest(
  'when user changes yhteystiedot',
  async ({ avustushakuID, acceptedHakemus: { hakemusID, userKey }, page }) => {
    const { token } = await getHakemusTokenAndRegisterNumber(hakemusID)
    const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
    const hakemusEditPage = await hakijaAvustusHakuPage.navigateToYhteyshenkilöChangePage(
      avustushakuID,
      userKey,
      token
    )
    await hakemusEditPage.changeHakijaNameToEtunimiTakanimi()
    await expect(page.getByText('Muutokset tallennettu')).toBeVisible()
  }
)

SwedishJotpaTest(
  'when swedish user changes yhteystiedot',
  async ({ avustushakuID, acceptedHakemus: { hakemusID, userKey }, page }) => {
    const { token } = await getHakemusTokenAndRegisterNumber(hakemusID)
    const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
    const hakemusEditPage = await hakijaAvustusHakuPage.navigateToYhteyshenkilöChangePage(
      avustushakuID,
      userKey,
      token,
      'sv'
    )
    await hakemusEditPage.changeHakijaNameToEtunimiTakanimi()
    await expect(page.getByText('Ändringarna har sparats')).toBeVisible()
  }
)
