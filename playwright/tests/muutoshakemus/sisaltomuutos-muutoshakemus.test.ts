import { expect } from '@playwright/test'
import { muutoshakemusTest } from '../../fixtures/muutoshakemusTest'
import { HakijaMuutoshakemusPage } from '../../pages/hakijaMuutoshakemusPage'
import { HakemustenArviointiPage } from '../../pages/hakemustenArviointiPage'

const sisaltomuutosPerustelut = 'Muutamme kaiken muuttamisen ilosta'

const test = muutoshakemusTest.extend<{
  hakemustenArviointiPage: HakemustenArviointiPage
}>({
  hakemustenArviointiPage: async ({ page, acceptedHakemus: { hakemusID }, avustushakuID }, use) => {
    const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page)
    await hakijaMuutoshakemusPage.navigate(hakemusID)
    await hakijaMuutoshakemusPage.clickHaenSisaltomuutosta()
    await hakijaMuutoshakemusPage.fillSisaltomuutosPerustelut(sisaltomuutosPerustelut)
    await hakijaMuutoshakemusPage.clickSendMuutoshakemus()
    await hakijaMuutoshakemusPage.expectMuutoshakemusToBeSubmittedSuccessfully(true)
    const sisaltomuutos = await hakijaMuutoshakemusPage.getMuutoshakemusSisaltomuutosPerustelut()
    expect(sisaltomuutos).toEqual(sisaltomuutosPerustelut)
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    await hakemustenArviointiPage.navigateToLatestMuutoshakemus(avustushakuID, hakemusID)
    const hakijaPerustelut = await hakemustenArviointiPage.getSisaltomuutosPerustelut()
    expect(hakijaPerustelut).toEqual(sisaltomuutosPerustelut)
    await use(hakemustenArviointiPage)
  },
})

test.setTimeout(180000)

test('can reject sisaltomuutos muutoshakemus', async ({ hakemustenArviointiPage }) => {
  await hakemustenArviointiPage.setMuutoshakemusSisaltoDecision('rejected')
  await hakemustenArviointiPage.selectVakioperusteluInFinnish()
  await hakemustenArviointiPage.saveMuutoshakemus()
  const hakijaPerustelut = await hakemustenArviointiPage.getSisaltomuutosPerustelut()
  expect(hakijaPerustelut).toEqual(sisaltomuutosPerustelut)
  const virkailijaPerustelut = await hakemustenArviointiPage.getPaatosPerustelut()
  expect(virkailijaPerustelut).toEqual(
    'Opetushallitus on arvioinut hakemuksen. Opetushallitus on asiantuntija-arvioinnin perusteella ja asiaa harkittuaan päättänyt olla hyväksymättä haettuja muutoksia.'
  )
})

test('can accept sisaltomuutos muutoshakemus', async ({ hakemustenArviointiPage }) => {
  await hakemustenArviointiPage.setMuutoshakemusSisaltoDecision('accepted')
  await hakemustenArviointiPage.selectVakioperusteluInFinnish()
  await hakemustenArviointiPage.saveMuutoshakemus()
  const hakijaPerustelut = await hakemustenArviointiPage.getSisaltomuutosPerustelut()
  expect(hakijaPerustelut).toEqual(sisaltomuutosPerustelut)
  const virkailijaPerustelut = await hakemustenArviointiPage.getPaatosPerustelut()
  expect(virkailijaPerustelut).toEqual(
    'Opetushallitus on arvioinut hakemuksen. Opetushallitus on asiantuntija-arvioinnin perusteella ja asiaa harkittuaan päättänyt hyväksyä haetut muutokset hakemuksen mukaisesti.'
  )
})

test('can accept_with_changes sisaltomuutos muutoshakemus', async ({ hakemustenArviointiPage }) => {
  await hakemustenArviointiPage.setMuutoshakemusSisaltoDecision('accepted_with_changes')
  await test.step('shows disclaimer if accepting with changes', async () => {
    const disclaimer = await hakemustenArviointiPage.getMuutoshakemusNotice()
    expect(disclaimer).toEqual(
      'Olet tekemässä päätöksen, jossa haetut sisältömuutokset hyväksytään muutettuna. Varmista, että perusteluissa hakijalle kuvataan mitkä haetuista sisältömuutoksista hyväksytään ja mitkä hylätään.'
    )
  })
  await hakemustenArviointiPage.selectVakioperusteluInFinnish()
  await hakemustenArviointiPage.saveMuutoshakemus()
  const hakijaPerustelut = await hakemustenArviointiPage.getSisaltomuutosPerustelut()
  expect(hakijaPerustelut).toEqual(sisaltomuutosPerustelut)
  const virkailijaPerustelut = await hakemustenArviointiPage.getPaatosPerustelut()
  expect(virkailijaPerustelut).toEqual(
    'Opetushallitus on arvioinut hakemuksen. Opetushallitus on asiantuntija-arvioinnin perusteella ja asiaa harkittuaan päättänyt hyväksyä haetut muutokset muutettuna, siten kuin ne kuvataan tässä avustuspäätöksessä.'
  )
})
