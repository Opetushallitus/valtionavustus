import { budjettimuutoshakemusTest } from '../../fixtures/budjettimuutoshakemusTest'
import { DefaultValueFixtures } from '../../fixtures/defaultValues'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { HakijaMuutoshakemusPage } from '../../pages/hakija/hakijaMuutoshakemusPage'
import { HakijaMuutoshakemusPaatosPage } from '../../pages/hakija/hakijaMuutoshakemusPaatosPage'
import { parseMuutoshakemusPaatosFromEmails } from '../../utils/emails'
import { setPaatosTemplateVersion } from '../../utils/hakemus'
import { expect, test } from '@playwright/test'

test.setTimeout(180000)

const hyvaksyja = '_ valtionavustus'

budjettimuutoshakemusTest.extend<Pick<DefaultValueFixtures, 'ukotettuValmistelija'>>({
  ukotettuValmistelija: 'Viivi Virkailija',
})(
  'Muutoshakemuksen paatos nakyy hakijalle, kun hakemuksella ei ole ukotettua valmistelijaa',
  async ({ page, avustushakuID, ukotettuValmistelija, acceptedHakemus: { hakemusID } }) => {
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page)
    const hakijaMuutoshakemusPaatosPage = new HakijaMuutoshakemusPaatosPage(page)
    const paatos = hakijaMuutoshakemusPaatosPage.locators()

    await test.step('remove ukotettu valmistelija from avustushaku', async () => {
      const haunTiedotPage = await new HakujenHallintaPage(page).navigate(avustushakuID)
      const roleRow = haunTiedotPage.locators.hakuRole.roleRow(ukotettuValmistelija)
      await Promise.all([
        page.waitForResponse(
          (resp) => resp.url().includes('/role/') && resp.request().method() === 'DELETE'
        ),
        roleRow.removeButton.click(),
      ])
      await expect(roleRow.row).toBeHidden()
    })

    await test.step('send muutoshakemus', async () => {
      await hakijaMuutoshakemusPage.navigate(hakemusID)
      await hakijaMuutoshakemusPage.clickHaenSisaltomuutosta()
      await hakijaMuutoshakemusPage.fillSisaltomuutosPerustelut('Muutamme kaiken')
      await hakijaMuutoshakemusPage.sendMuutoshakemus(true)
    })

    let linkToMuutoshakemusPaatos: string
    await test.step('hyvaksyja makes the paatos', async () => {
      await hakemustenArviointiPage.navigateToLatestMuutoshakemus(avustushakuID, hakemusID)
      await hakemustenArviointiPage.selectVakioperusteluInFinnish()
      await hakemustenArviointiPage.saveMuutoshakemus()

      const links = await parseMuutoshakemusPaatosFromEmails(hakemusID)
      if (!links.linkToMuutoshakemusPaatos) {
        throw Error('No linkToMuutoshakemusPaatos found')
      }
      linkToMuutoshakemusPaatos = links.linkToMuutoshakemusPaatos
    })

    await test.step('paatos shows hyvaksyja as ratkaisija and esittelija', async () => {
      await hakijaMuutoshakemusPaatosPage.navigate(linkToMuutoshakemusPaatos)
      await expect(paatos.tekijaTitle).toHaveText('Ratkaisija ja esittelijä')
      await expect(paatos.ratkaisija).toHaveText(hyvaksyja)
      await expect(paatos.esittelija).toHaveText(hyvaksyja)
      await expect(paatos.lisatietoja).not.toContainText(ukotettuValmistelija)
    })

    await test.step('paatos template version 1 shows hyvaksyja', async () => {
      await setPaatosTemplateVersion(page.request, hakemusID, 1)
      await hakijaMuutoshakemusPaatosPage.navigate(linkToMuutoshakemusPaatos)
      await expect(paatos.tekijaTitle).toHaveText('Hyväksyjä')
      await expect(paatos.hyvaksyja).toHaveText(hyvaksyja)
      await expect(paatos.lisatietoja).not.toContainText(ukotettuValmistelija)
    })
  }
)
