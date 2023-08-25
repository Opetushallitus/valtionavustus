import { expect } from '@playwright/test'
import { muutoshakemusTest } from '../../fixtures/muutoshakemusTest'
import { HakijaMuutoshakemusPage } from '../../pages/hakija/hakijaMuutoshakemusPage'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { MuutoshakemusTab } from '../../pages/virkailija/hakemusten-arviointi/MuutoshakemusTab'

const sisaltomuutosPerustelut = 'Muutamme kaiken muuttamisen ilosta'

const test = muutoshakemusTest.extend<{
  muutoshakemusTab: MuutoshakemusTab
}>({
  muutoshakemusTab: async ({ page, acceptedHakemus: { hakemusID }, avustushakuID }, use) => {
    await test.step('submit muutoshakemus', async () => {
      const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page)
      await hakijaMuutoshakemusPage.navigate(hakemusID)
      await hakijaMuutoshakemusPage.clickHaenSisaltomuutosta()
      await hakijaMuutoshakemusPage.fillSisaltomuutosPerustelut(sisaltomuutosPerustelut)
      await hakijaMuutoshakemusPage.clickSendMuutoshakemus()
      await hakijaMuutoshakemusPage.expectMuutoshakemusToBeSubmittedSuccessfully(true)
      const sisaltomuutos = await hakijaMuutoshakemusPage.getMuutoshakemusSisaltomuutosPerustelut()
      expect(sisaltomuutos).toEqual(sisaltomuutosPerustelut)
    })

    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    const muutoshakemusTab = await hakemustenArviointiPage.navigateToLatestMuutoshakemus(
      avustushakuID,
      hakemusID
    )
    await expect(muutoshakemusTab.locators.sisaltomuutosPerustelut).toHaveText(
      sisaltomuutosPerustelut
    )

    await use(muutoshakemusTab)
  },
})

test.setTimeout(180000)

test('can reject sisaltomuutos muutoshakemus', async ({ muutoshakemusTab }) => {
  await muutoshakemusTab.setMuutoshakemusSisaltoDecision('rejected')
  await muutoshakemusTab.selectVakioperusteluInFinnish()
  await muutoshakemusTab.saveMuutoshakemus()
  await expect(muutoshakemusTab.locators.sisaltomuutosPerustelut).toHaveText(
    sisaltomuutosPerustelut
  )

  await expect(muutoshakemusTab.locators.paatosPerustelut).toHaveText(
    'Opetushallitus on arvioinut hakemuksen. Opetushallitus on asiantuntija-arvioinnin perusteella ja asiaa harkittuaan päättänyt olla hyväksymättä haettuja muutoksia.'
  )
})

test('can accept sisaltomuutos muutoshakemus', async ({ muutoshakemusTab }) => {
  await muutoshakemusTab.setMuutoshakemusSisaltoDecision('accepted')
  await muutoshakemusTab.selectVakioperusteluInFinnish()
  await muutoshakemusTab.saveMuutoshakemus()

  await expect(muutoshakemusTab.locators.sisaltomuutosPerustelut).toHaveText(
    sisaltomuutosPerustelut
  )
  await expect(muutoshakemusTab.locators.paatosPerustelut).toHaveText(
    'Opetushallitus on arvioinut hakemuksen. Opetushallitus on asiantuntija-arvioinnin perusteella ja asiaa harkittuaan päättänyt hyväksyä haetut muutokset hakemuksen mukaisesti.'
  )
})

test('can accept_with_changes sisaltomuutos muutoshakemus', async ({ muutoshakemusTab }) => {
  await muutoshakemusTab.setMuutoshakemusSisaltoDecision('accepted_with_changes')
  await expect(
    muutoshakemusTab.locators.hakemuksenSisalto,
    'shows disclaimer if accepting with changes'
  ).toContainText(
    'Olet tekemässä päätöksen, jossa haetut sisältömuutokset hyväksytään muutettuna. Varmista, että perusteluissa hakijalle kuvataan mitkä haetuista sisältömuutoksista hyväksytään ja mitkä hylätään.'
  )
  await muutoshakemusTab.selectVakioperusteluInFinnish()
  await muutoshakemusTab.saveMuutoshakemus()

  await expect(muutoshakemusTab.locators.sisaltomuutosPerustelut).toHaveText(
    sisaltomuutosPerustelut
  )
  await expect(muutoshakemusTab.locators.paatosPerustelut).toHaveText(
    'Opetushallitus on arvioinut hakemuksen. Opetushallitus on asiantuntija-arvioinnin perusteella ja asiaa harkittuaan päättänyt hyväksyä haetut muutokset muutettuna, siten kuin ne kuvataan tässä avustuspäätöksessä.'
  )
})
