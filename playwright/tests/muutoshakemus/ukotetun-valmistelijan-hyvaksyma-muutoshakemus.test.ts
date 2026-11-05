import { budjettimuutoshakemusTest } from '../../fixtures/budjettimuutoshakemusTest'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { HakijaMuutoshakemusPage } from '../../pages/hakija/hakijaMuutoshakemusPage'
import { HakijaMuutoshakemusPaatosPage } from '../../pages/hakija/hakijaMuutoshakemusPaatosPage'
import { parseMuutoshakemusPaatosFromEmails } from '../../utils/emails'
import { expect, test } from '@playwright/test'

test.setTimeout(180000)

budjettimuutoshakemusTest(
  'Ukotetun valmistelijan hyvaksyessa muutoshakemuksen han on paatoksen ratkaisija ja esittelija, eika paatos muutu ukotuksen vaihtuessa',
  async ({ page, avustushakuID, ukotettuValmistelija, acceptedHakemus: { hakemusID } }) => {
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page)
    const hakijaMuutoshakemusPaatosPage = new HakijaMuutoshakemusPaatosPage(page)
    const paatos = hakijaMuutoshakemusPaatosPage.locators()

    await test.step('send muutoshakemus', async () => {
      await hakijaMuutoshakemusPage.navigate(hakemusID)
      await hakijaMuutoshakemusPage.clickHaenSisaltomuutosta()
      await hakijaMuutoshakemusPage.fillSisaltomuutosPerustelut('Muutamme kaiken')
      await hakijaMuutoshakemusPage.sendMuutoshakemus(true)
    })

    let linkToMuutoshakemusPaatos: string
    await test.step('ukotettu valmistelija makes the paatos', async () => {
      await hakemustenArviointiPage.navigateToLatestMuutoshakemus(avustushakuID, hakemusID)
      await hakemustenArviointiPage.selectVakioperusteluInFinnish()
      await hakemustenArviointiPage.saveMuutoshakemus()

      const links = await parseMuutoshakemusPaatosFromEmails(hakemusID)
      if (!links.linkToMuutoshakemusPaatos) {
        throw Error('No linkToMuutoshakemusPaatos found')
      }
      linkToMuutoshakemusPaatos = links.linkToMuutoshakemusPaatos
      await hakijaMuutoshakemusPaatosPage.navigate(linkToMuutoshakemusPaatos)

      await expect(paatos.ratkaisija).toHaveText(ukotettuValmistelija)
      await expect(paatos.esittelija).toHaveText(ukotettuValmistelija)
      await expect(paatos.lisatietoja).toContainText(ukotettuValmistelija)
    })

    await test.step('paatos does not change when ukotettu valmistelija changes', async () => {
      await hakemustenArviointiPage.navigate(avustushakuID)
      await hakemustenArviointiPage.selectValmistelijaForHakemus(hakemusID, 'Viivi Virkailija')

      await hakijaMuutoshakemusPaatosPage.navigate(linkToMuutoshakemusPaatos)
      await expect(paatos.ratkaisija).toHaveText(ukotettuValmistelija)
      await expect(paatos.esittelija).toHaveText(ukotettuValmistelija)
      await expect(paatos.lisatietoja).toContainText(ukotettuValmistelija)
      await expect(paatos.lisatietoja).not.toContainText('Viivi Virkailija')
    })
  }
)
