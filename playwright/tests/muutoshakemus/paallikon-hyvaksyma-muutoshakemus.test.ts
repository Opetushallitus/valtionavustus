import {budjettimuutoshakemusTest as test} from "../../fixtures/budjettimuutoshakemusTest";
import {HakemustenArviointiPage} from "../../pages/hakemustenArviointiPage";
import {HakujenHallintaPage} from "../../pages/hakujenHallintaPage";
import {HakijaMuutoshakemusPage} from "../../pages/hakijaMuutoshakemusPage";
import {HakijaMuutoshakemusPaatosPage} from "../../pages/hakijaMuutoshakemusPaatosPage";
import {parseMuutoshakemusPaatosFromEmails} from "../../utils/emails";
import {expect} from "@playwright/test";
import {HAKIJA_URL} from "../../../test/test-util";

test.setTimeout(180000)

const sisaltomuutosPerustelut = 'Muutamme kaiken muuttamisen ilosta'

test('Ukottamattoman valmistelijan (paallikon) hyvaksyessa muutoshakemuksen, hyvaksyjaksi tulee hyvaksyja, esittelijaksi ukotettu valmistelija ja lisatietoja osioon tulee ukotettu valmistelija',
  async ({page, avustushakuID, acceptedHakemus: {hakemusID}}) => {
  const user = 'Viivi'
  const hakujenHallintaPage = new HakujenHallintaPage(page)
  const hakemustenArviointiPage = new HakemustenArviointiPage(page)
  const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page)
  const hakijaMuutoshakemusPaatosPage = new HakijaMuutoshakemusPaatosPage(page)

  await test.step('ukota user for hakemus', async () => {
    await hakemustenArviointiPage.navigate(avustushakuID)
    await hakemustenArviointiPage.prepareSelectingValmistelijaForHakemus(hakemusID, user)
  })
  await test.step('remove current user from avustushaku valmistelijat', async () => {
    await hakujenHallintaPage.navigate(avustushakuID)
    await hakujenHallintaPage.removeUser('_-valtionavustus')
  })
  await test.step('send muutoshakemus', async () => {
    await hakijaMuutoshakemusPage.navigate(hakemusID)
    await hakijaMuutoshakemusPage.clickHaenSisaltomuutosta()
    await hakijaMuutoshakemusPage.fillSisaltomuutosPerustelut(sisaltomuutosPerustelut)
    await hakijaMuutoshakemusPage.sendMuutoshakemus(true)
  })
  await test.step('shows correct values in preview', async () => {
    await hakemustenArviointiPage.navigateToLatestMuutoshakemus(avustushakuID, hakemusID)
    await hakemustenArviointiPage.openPaatosPreview()
    const hyvaksyja = await hakemustenArviointiPage.paatosPreviewHyvaksyja()
    expect(hyvaksyja).toEqual('_ valtionavustus')
    const esittelija = await hakemustenArviointiPage.paatosPreviewEsittelija()
    expect(esittelija).toContain(user)
    const lisatietoja = await hakemustenArviointiPage.paatosPreviewLisatietoja()
    expect(lisatietoja).toContain(user)
    await hakemustenArviointiPage.closePaatosPreview()
  })
  await test.step('shows correct values in paatos for hakija', async () => {
    await hakemustenArviointiPage.selectVakioperusteluInFinnish()
    await hakemustenArviointiPage.saveMuutoshakemus()

    const links = await parseMuutoshakemusPaatosFromEmails(hakemusID)
    if (!links.linkToMuutoshakemusPaatos) {
      throw Error('No linkToMuutoshakemusPaatos found')
    }
    await hakijaMuutoshakemusPaatosPage.navigate(links.linkToMuutoshakemusPaatos)

    const hakemusHyvaksyja = await hakijaMuutoshakemusPaatosPage.paatoksenHyvaksyja()
    expect(hakemusHyvaksyja).toEqual('_ valtionavustus')
    const hakemusEsittelija = await hakijaMuutoshakemusPaatosPage.paatoksenEsittelija()
    expect(hakemusEsittelija).toContain(user)
    const hakemusLisatietoja = await hakijaMuutoshakemusPaatosPage.lisatietoja()
    expect(hakemusLisatietoja).toContain(user)
  })
  await test.step('clicking link in asia section navigates to muutoshakemus', async () => {
    await hakijaMuutoshakemusPaatosPage.clickLinkToMuutoshakemus()
    const urlRegex = new RegExp(`${HAKIJA_URL}/muutoshakemus\\?user-key=.*&avustushaku-id=${avustushakuID}&lang=fi`)
    expect(page.url()).toMatch(urlRegex)
  })
})
