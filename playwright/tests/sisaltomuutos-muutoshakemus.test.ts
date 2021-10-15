import {muutoshakemusTest} from "../fixtures/muutoshakemusTest";
import {HakijaMuutoshakemusPage} from "../pages/hakijaMuutoshakemusPage";
import {HakemustenArviointiPage} from "../pages/hakemustenArviointiPage";

const test = muutoshakemusTest.extend<{hakemustenArviointiPage: HakemustenArviointiPage}>({
  hakemustenArviointiPage: async ({page, hakemus: {hakemusID}, avustushakuID}, use) => {
    const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page)
    await hakijaMuutoshakemusPage.navigate(hakemusID)
    await hakijaMuutoshakemusPage.clickHaenSisaltomuutosta()
    await hakijaMuutoshakemusPage.fillSisaltomuutosPerustelut('test')
    await hakijaMuutoshakemusPage.clickSendMuutoshakemus()
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    await hakemustenArviointiPage.navigateToLatestMuutoshakemus(avustushakuID, hakemusID)
    await use(hakemustenArviointiPage)
  }
})

test.setTimeout(180000)

test('can reject sisaltomuutos muutoshakemus', async ({hakemustenArviointiPage}) => {
  await hakemustenArviointiPage.setMuutoshakemusSisaltoDecision('rejected')
  await hakemustenArviointiPage.selectVakioperusteluInFinnish()
  await hakemustenArviointiPage.saveMuutoshakemus()
})

test('can accept sisaltomuutos muutoshakemus', async ({hakemustenArviointiPage}) => {
  await hakemustenArviointiPage.setMuutoshakemusSisaltoDecision('accepted', 'Ei kommentoitavaa')
  await hakemustenArviointiPage.selectVakioperusteluInFinnish()
  await hakemustenArviointiPage.saveMuutoshakemus()
})

test('can accept_with_changes sisaltomuutos muutoshakemus', async ({hakemustenArviointiPage}) => {
  await hakemustenArviointiPage.setMuutoshakemusSisaltoDecision('accepted_with_changes', 'Ei kommentoitavaa')
  await hakemustenArviointiPage.selectVakioperusteluInFinnish()
  await hakemustenArviointiPage.saveMuutoshakemus()
})
