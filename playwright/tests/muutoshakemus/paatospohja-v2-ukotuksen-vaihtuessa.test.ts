import { budjettimuutoshakemusTest } from '../../fixtures/budjettimuutoshakemusTest'
import { DefaultValueFixtures } from '../../fixtures/defaultValues'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { HakijaMuutoshakemusPage } from '../../pages/hakija/hakijaMuutoshakemusPage'
import { HakijaMuutoshakemusPaatosPage } from '../../pages/hakija/hakijaMuutoshakemusPaatosPage'
import { parseMuutoshakemusPaatosFromEmails } from '../../utils/emails'
import { expect, test } from '@playwright/test'

test.setTimeout(180000)

const hyvaksyja = '_ valtionavustus'
const ukotettuValmistelijanEmail = 'viivi.virkailja@exmaple.com'
const uusiUkotettuValmistelija = 'Jotpa Käyttäjä'

budjettimuutoshakemusTest.extend<Pick<DefaultValueFixtures, 'ukotettuValmistelija'>>({
  ukotettuValmistelija: 'Viivi Virkailija',
})(
  'Paatospohjalla v2 ratkaisija, esittelija ja lisatietoja eivat muutu kun ukotettu valmistelija vaihtuu',
  async ({ page, avustushakuID, ukotettuValmistelija, acceptedHakemus: { hakemusID } }) => {
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page)
    const hakijaMuutoshakemusPaatosPage = new HakijaMuutoshakemusPaatosPage(page)
    const paatos = hakijaMuutoshakemusPaatosPage.locators()

    const expectPaatosRatkaistuJaEsitelty = async () => {
      await expect(paatos.tekijaTitle).toHaveText('Ratkaisija ja esittelijä')
      await expect(paatos.ratkaisija).toHaveText(ukotettuValmistelija)
      await expect(paatos.esittelija).toHaveText(hyvaksyja)
      await expect(paatos.lisatietoja).toContainText(ukotettuValmistelija)
      await expect(paatos.lisatietoja).toContainText(ukotettuValmistelijanEmail)
    }

    await test.step('add another valmistelija to avustushaku', async () => {
      const haunTiedotPage = await new HakujenHallintaPage(page).navigate(avustushakuID)
      await haunTiedotPage.addValmistelija(uusiUkotettuValmistelija)
    })

    await test.step('send muutoshakemus', async () => {
      await hakijaMuutoshakemusPage.navigate(hakemusID)
      await hakijaMuutoshakemusPage.clickHaenSisaltomuutosta()
      await hakijaMuutoshakemusPage.fillSisaltomuutosPerustelut('Muutamme kaiken')
      await hakijaMuutoshakemusPage.sendMuutoshakemus(true)
    })

    let linkToMuutoshakemusPaatos: string
    await test.step('someone other than ukotettu valmistelija makes the paatos', async () => {
      await hakemustenArviointiPage.navigateToLatestMuutoshakemus(avustushakuID, hakemusID)
      await hakemustenArviointiPage.selectVakioperusteluInFinnish()
      await hakemustenArviointiPage.saveMuutoshakemus()

      const links = await parseMuutoshakemusPaatosFromEmails(hakemusID)
      if (!links.linkToMuutoshakemusPaatos) {
        throw Error('No linkToMuutoshakemusPaatos found')
      }
      linkToMuutoshakemusPaatos = links.linkToMuutoshakemusPaatos
    })

    await test.step('paatos shows ukotettu valmistelija as ratkaisija and hyvaksyja as esittelija', async () => {
      await hakijaMuutoshakemusPaatosPage.navigate(linkToMuutoshakemusPaatos)
      await expectPaatosRatkaistuJaEsitelty()
    })

    await test.step('paatos does not change when ukotettu valmistelija changes', async () => {
      await hakemustenArviointiPage.navigate(avustushakuID)
      await hakemustenArviointiPage.selectValmistelijaForHakemus(
        hakemusID,
        uusiUkotettuValmistelija
      )

      await hakijaMuutoshakemusPaatosPage.navigate(linkToMuutoshakemusPaatos)
      await expectPaatosRatkaistuJaEsitelty()
      await expect(paatos.ratkaisija).not.toContainText(uusiUkotettuValmistelija)
      await expect(paatos.esittelija).not.toContainText(uusiUkotettuValmistelija)
      await expect(paatos.lisatietoja).not.toContainText(uusiUkotettuValmistelija)
    })
  }
)
