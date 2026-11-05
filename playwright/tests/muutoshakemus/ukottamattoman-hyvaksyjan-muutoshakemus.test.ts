import { budjettimuutoshakemusTest } from '../../fixtures/budjettimuutoshakemusTest'
import { DefaultValueFixtures } from '../../fixtures/defaultValues'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { HakijaMuutoshakemusPage } from '../../pages/hakija/hakijaMuutoshakemusPage'
import { HakijaMuutoshakemusPaatosPage } from '../../pages/hakija/hakijaMuutoshakemusPaatosPage'
import { parseMuutoshakemusPaatosFromEmails } from '../../utils/emails'
import { expect, test } from '@playwright/test'

test.setTimeout(180000)

const sisaltomuutosPerustelut = 'Muutamme kaiken muuttamisen ilosta'

budjettimuutoshakemusTest.extend<Pick<DefaultValueFixtures, 'ukotettuValmistelija'>>({
  ukotettuValmistelija: 'Viivi Virkailija',
})(
  'Ukottamattoman hyvaksyjan hyvaksyessa muutoshakemuksen, ratkaisijaksi ja lisatietoja osioon tulee ukotettu valmistelija ja esittelijaksi hyvaksyja',
  async ({ page, avustushakuID, ukotettuValmistelija, acceptedHakemus: { hakemusID } }) => {
    const hyvaksyja = '_ valtionavustus'
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page)
    const hakijaMuutoshakemusPaatosPage = new HakijaMuutoshakemusPaatosPage(page)
    const paatos = hakijaMuutoshakemusPaatosPage.locators()

    await test.step('send muutoshakemus', async () => {
      await hakijaMuutoshakemusPage.navigate(hakemusID)
      await hakijaMuutoshakemusPage.clickHaenSisaltomuutosta()
      await hakijaMuutoshakemusPage.fillSisaltomuutosPerustelut(sisaltomuutosPerustelut)
      await hakijaMuutoshakemusPage.sendMuutoshakemus(true)
    })
    await test.step('shows correct values in preview', async () => {
      const muutoshakemusTab = await hakemustenArviointiPage.navigateToLatestMuutoshakemus(
        avustushakuID,
        hakemusID
      )
      const preview = await muutoshakemusTab.openPaatosPreview()
      await expect(preview.ratkaisija).toHaveText(ukotettuValmistelija)
      await expect(preview.esittelija).toHaveText(hyvaksyja)
      await expect(preview.lisatietoja).toContainText(ukotettuValmistelija)
      await preview.close()
    })

    await test.step('shows correct values in paatos for hakija', async () => {
      await hakemustenArviointiPage.selectVakioperusteluInFinnish()
      await hakemustenArviointiPage.saveMuutoshakemus()

      const links = await parseMuutoshakemusPaatosFromEmails(hakemusID)
      if (!links.linkToMuutoshakemusPaatos) {
        throw Error('No linkToMuutoshakemusPaatos found')
      }
      await hakijaMuutoshakemusPaatosPage.navigate(links.linkToMuutoshakemusPaatos)

      await expect(paatos.ratkaisija).toHaveText(ukotettuValmistelija)
      await expect(paatos.esittelija).toHaveText(hyvaksyja)
      await expect(paatos.lisatietoja).toContainText(ukotettuValmistelija)
    })
    await test.step('asia section does not link to muutoshakemus', async () => {
      await expect(page.getByTestId('link-to-muutoshakemus')).toHaveCount(0)
    })
  }
)
