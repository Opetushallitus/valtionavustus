import { expect, test } from '@playwright/test'

import { budjettimuutoshakemusTest } from '../../fixtures/budjettimuutoshakemusTest'
import { DefaultValueFixtures } from '../../fixtures/defaultValues'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { HakijaMuutoshakemusPage } from '../../pages/hakija/hakijaMuutoshakemusPage'
import { switchUserIdentityTo } from '../../utils/util'

test.setTimeout(180000)

const sisaltomuutosPerustelut = 'Muutamme sisältöä testataksemme oikeuksia'

budjettimuutoshakemusTest.extend<Pick<DefaultValueFixtures, 'ukotettuValmistelija'>>({
  ukotettuValmistelija: 'Viivi Virkailija',
})(
  'muutospäätös oikeudet - vain valmistelija tai pääkäyttäjä voi tehdä päätöksen',
  async ({ page, avustushakuID, acceptedHakemus: { hakemusID } }) => {
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page)

    await test.step('send muutoshakemus', async () => {
      await hakijaMuutoshakemusPage.navigate(hakemusID)
      await hakijaMuutoshakemusPage.clickHaenSisaltomuutosta()
      await hakijaMuutoshakemusPage.fillSisaltomuutosPerustelut(sisaltomuutosPerustelut)
      await hakijaMuutoshakemusPage.sendMuutoshakemus(true)
    })

    await test.step('pääkäyttäjä joka ei ole valmistelija voi tehdä muutospäätöksen', async () => {
      // Default user _ valtionavustus is va-admin but NOT the assigned valmistelija (Viivi)
      await hakemustenArviointiPage.navigateToLatestMuutoshakemus(avustushakuID, hakemusID)

      // Warning message should NOT be visible for admin
      const warningNotice = page.getByTestId('muutospaatos-not-allowed-notice')
      await expect(warningNotice).toBeHidden()

      // Reason textarea should be editable (not disabled by fieldset)
      const reasonTextarea = page.locator('textarea[name="reason"]')
      await expect(reasonTextarea).toBeEditable()
    })

    await test.step('valmistelija voi tehdä muutospäätöksen', async () => {
      await switchUserIdentityTo(page, 'viivivirkailija')

      // Warning message should NOT be visible for valmistelija
      const warningNotice = page.getByTestId('muutospaatos-not-allowed-notice')
      await expect(warningNotice).toBeHidden()

      // Reason textarea should be editable (not disabled by fieldset)
      const reasonTextarea = page.locator('textarea[name="reason"]')
      await expect(reasonTextarea).toBeEditable()
    })
  }
)

budjettimuutoshakemusTest(
  'muutospäätös oikeudet - ei-valmistelija ei voi tehdä päätöstä',
  async ({ page, avustushakuID, acceptedHakemus: { hakemusID } }) => {
    // Default ukotettuValmistelija is '_ valtionavustus' (admin)
    // Viivi Virkailija is NOT the valmistelija and is NOT an admin
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page)

    await test.step('send muutoshakemus', async () => {
      await hakijaMuutoshakemusPage.navigate(hakemusID)
      await hakijaMuutoshakemusPage.clickHaenSisaltomuutosta()
      await hakijaMuutoshakemusPage.fillSisaltomuutosPerustelut(sisaltomuutosPerustelut)
      await hakijaMuutoshakemusPage.sendMuutoshakemus(true)
    })

    await test.step('ei-valmistelija (va-user) ei voi tehdä muutospäätöstä', async () => {
      await switchUserIdentityTo(page, 'viivivirkailija')
      await hakemustenArviointiPage.navigateToLatestMuutoshakemus(avustushakuID, hakemusID)

      // Warning message should be visible
      const warningNotice = page.getByTestId('muutospaatos-not-allowed-notice')
      await expect(warningNotice).toBeVisible()
      await expect(warningNotice).toContainText(
        'Muutospäätöksen tekeminen ei ole mahdollista, koska et ole tämän avustuksen valmistelija'
      )

      // Reason textarea should NOT be editable (disabled by fieldset)
      const reasonTextarea = page.locator('textarea[name="reason"]')
      await expect(reasonTextarea).not.toBeEditable()
    })

    await test.step('pääkäyttäjä voi silti tehdä muutospäätöksen', async () => {
      await switchUserIdentityTo(page, 'paivipaakayttaja')

      // Warning should be hidden for admin
      const warningNotice = page.getByTestId('muutospaatos-not-allowed-notice')
      await expect(warningNotice).toBeHidden()

      // Reason textarea should be editable for admin
      const reasonTextarea = page.locator('textarea[name="reason"]')
      await expect(reasonTextarea).toBeEditable()
    })
  }
)
