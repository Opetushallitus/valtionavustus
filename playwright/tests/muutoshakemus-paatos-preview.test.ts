import {MuutoshakemusValues} from "../utils/types";
import moment from "moment";
import {muutoshakemusTest} from "../fixtures/muutoshakemusTest";
import {expect} from "@playwright/test";
import {HakemustenArviointiPage} from "../pages/hakemustenArviointiPage";
import {HakijaMuutoshakemusPage} from "../pages/hakijaMuutoshakemusPage";
import {
  BudjettimuutoshakemusFixtures,
  budjettimuutoshakemusTest
} from "../fixtures/budjettimuutoshakemusTest";
import {BudgetAmount} from "../../test/test-util";
import {sortedFormTable} from "../utils/budget";

const muutoshakemus1: MuutoshakemusValues = {
  jatkoaika: moment(new Date())
    .add(2, 'months')
    .add(1, 'days')
    .locale('fi'),
  jatkoaikaPerustelu: 'Ei kyl millään ehdi deadlineen mennessä ku mun koira söi ne tutkimustulokset'
}

const sisaltomuutosPerustelut = 'Muutamme kaiken muuttamisen ilosta'

const test = muutoshakemusTest.extend<{hakemustenArviointiPage: HakemustenArviointiPage}>({
  hakemustenArviointiPage: async ({hakemusID, avustushakuID, page}, use) => {
    const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page)
    await hakijaMuutoshakemusPage.navigate(hakemusID)
    await hakijaMuutoshakemusPage.clickHaenSisaltomuutosta()
    await hakijaMuutoshakemusPage.fillSisaltomuutosPerustelut(sisaltomuutosPerustelut)
    await hakijaMuutoshakemusPage.fillJatkoaikaValues(muutoshakemus1)
    await hakijaMuutoshakemusPage.sendMuutoshakemus(true)
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    await hakemustenArviointiPage.navigate(avustushakuID)
    await hakemustenArviointiPage.clickMuutoshakemusStatusField(hakemusID)
    await hakemustenArviointiPage.clickMuutoshakemusTab()
    await use(hakemustenArviointiPage)
  }
})

test.setTimeout(180000)

test.describe.parallel('muutoshakemus päätös preview', () => {

  test('accepted päätös', async ({hakemustenArviointiPage}) => {
    await hakemustenArviointiPage.selectVakioperusteluInFinnish()
    const decision = 'Ei huomioitavaa'
    await hakemustenArviointiPage.setMuutoshakemusSisaltoDecision('accepted', decision)
    await hakemustenArviointiPage.openPaatosPreview()
    await test.step('has correct values', async () => {
      await hakemustenArviointiPage.validateMuutoshakemusPaatosCommonValues()
    })
    await test.step('correct jatkoaika päätös', async () => {
      const acceptedPaatos = await hakemustenArviointiPage.paatosPreviewJatkoaikaPaatos()
      expect(acceptedPaatos).toEqual('Hyväksytään haetut muutokset käyttöaikaan')
    })
    await test.step('correct sisältö päätös', async () => {
      const paatos = await hakemustenArviointiPage.paatosPreviewSisaltoPaatos()
      expect(paatos).toEqual('Hyväksytään haetut muutokset sisältöön ja toteutustapaan')
    })
    await test.step('correct sisältö content', async () => {
      const content = await hakemustenArviointiPage.paatosPreviewSisaltoContent()
      expect(content).toBe(decision)
    })
    await test.step('correct vakioperustelu', async () => {
      const perustelu = await hakemustenArviointiPage.paatosPreviewPerustelu()
      expect(perustelu).toEqual('Opetushallitus on arvioinut hakemuksen. Opetushallitus on asiantuntija-arvioinnin perusteella ja asiaa harkittuaan päättänyt hyväksyä haetut muutokset hakemuksen mukaisesti.')
    })
  })

  test('rejected päätös', async ({hakemustenArviointiPage}) => {
    await hakemustenArviointiPage.setMuutoshakemusJatkoaikaDecision('rejected')
    await hakemustenArviointiPage.setMuutoshakemusSisaltoDecision('rejected')
    await hakemustenArviointiPage.selectVakioperusteluInFinnish()
    await hakemustenArviointiPage.openPaatosPreview()
    await test.step('has correct values', async () => {
      await hakemustenArviointiPage.validateMuutoshakemusPaatosCommonValues()
    })
    await test.step('correct jatkoaika päätös', async () => {
      const acceptedPaatos = await hakemustenArviointiPage.paatosPreviewJatkoaikaPaatos()
      expect(acceptedPaatos).toEqual('Hylätään haetut muutokset käyttöaikaan')
    })
    await test.step('correct sisältö päätös', async () => {
      const paatos = await hakemustenArviointiPage.paatosPreviewSisaltoPaatos()
      expect(paatos).toEqual('Hylätään haetut muutokset sisältöön ja toteutustapaan')
    })
    await test.step('correct vakioperustelu', async () => {
      const perustelu = await hakemustenArviointiPage.paatosPreviewPerustelu()
      expect(perustelu).toEqual('Opetushallitus on arvioinut hakemuksen. Opetushallitus on asiantuntija-arvioinnin perusteella ja asiaa harkittuaan päättänyt olla hyväksymättä haettuja muutoksia.')
    })
  })

  test('accepted with changes päätös', async ({hakemustenArviointiPage}) => {
    await hakemustenArviointiPage.setMuutoshakemusJatkoaikaDecision('accepted_with_changes', '20.04.2400')
    const sisaltoDecision = 'Älä muuta ihan kaikkea'
    await hakemustenArviointiPage.setMuutoshakemusSisaltoDecision('accepted_with_changes', sisaltoDecision)
    await hakemustenArviointiPage.selectVakioperusteluInFinnish()
    await hakemustenArviointiPage.openPaatosPreview()
    await test.step('has correct values', async () => {
      await hakemustenArviointiPage.validateMuutoshakemusPaatosCommonValues()
    })
    await test.step('correct jatkoaika päätös', async () => {
      const acceptedPaatos = await hakemustenArviointiPage.paatosPreviewJatkoaikaPaatos()
      expect(acceptedPaatos).toEqual('Hyväksytään haetut muutokset käyttöaikaan muutettuna')
    })
    await test.step('correct new päättymispäivä', async () => {
      const acceptedDate = await hakemustenArviointiPage.paatosPreviewJatkoaikaValue()
      expect(acceptedDate).toBe('20.4.2400')
    })
    await test.step('correct sisältö päätös', async () => {
      const paatos = await hakemustenArviointiPage.paatosPreviewSisaltoPaatos()
      expect(paatos).toEqual('Hyväksytään haetut muutokset sisältöön ja toteutustapaan muutettuna')
    })
    await test.step('correct sisältö content', async () => {
      const content = await hakemustenArviointiPage.paatosPreviewSisaltoContent()
      expect(content).toBe(sisaltoDecision)
    })
    await test.step('correct vakioperustelu', async () => {
      const perustelu = await hakemustenArviointiPage.paatosPreviewPerustelu()
      expect(perustelu).toEqual('Opetushallitus on arvioinut hakemuksen. Opetushallitus on asiantuntija-arvioinnin perusteella ja asiaa harkittuaan päättänyt hyväksyä haetut muutokset muutettuna, siten kuin ne kuvataan tässä avustuspäätöksessä.')
    })
  })

})

const bTest = budjettimuutoshakemusTest.extend<BudjettimuutoshakemusFixtures & {hakemustenArviointiPage: HakemustenArviointiPage}>({
  hakemustenArviointiPage: async ({page, hakemusID, avustushakuID}, use) => {
    const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page)
    await hakijaMuutoshakemusPage.navigate(hakemusID)
    await hakijaMuutoshakemusPage.clickHaenMuutostaTaloudenKayttosuunnitelmaan()
    await hakijaMuutoshakemusPage.fillTalousarvioValues({
      equipment: '8999',
      material: '4001',
      personnel: '200100',
      steamship: '0',
    }, 'perustelu')
    await hakijaMuutoshakemusPage.clickSendMuutoshakemus()
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    await hakemustenArviointiPage.navigateToLatestMuutoshakemus(avustushakuID, hakemusID)
    await use(hakemustenArviointiPage)
  }
})

bTest.setTimeout(180000)

bTest.describe.parallel('budjettimuutos päätös preview', async () => {

  const budget: BudgetAmount = {
    personnel: '200000',
    material: '3001',
    equipment: '9999',
    'service-purchase': '1100',
    rent: '160616',
    steamship: '100',
    other: '10000000',
  }

  bTest('opens the paatos preview when "accepted with changes" is chosen', async ({hakemustenArviointiPage}) => {
    await hakemustenArviointiPage.setMuutoshakemusBudgetDecision('accepted_with_changes', budget)
    await hakemustenArviointiPage.openPaatosPreview()
    const expectedExistingBudget = [
      { description: 'Henkilöstömenot', amount: '200000 €' },
      { description: 'Aineet, tarvikkeet ja tavarat', amount: '3000 €' },
      { description: 'Laitehankinnat', amount: '10000 €' },
      { description: 'Palvelut', amount: '100 €' },
      { description: 'Vuokrat', amount: '161616 €' },
      { description: 'Matkamenot', amount: '100 €' },
      { description: 'Muut menot', amount: '10000000 €' }
    ]
    const currentValues = await hakemustenArviointiPage.existingBudgetTableCells()
    expect(sortedFormTable(currentValues)).toEqual(sortedFormTable(expectedExistingBudget))
    const expectedChangedBudget = [
      { description: 'Henkilöstömenot', amount: '200000' },
      { description: 'Aineet, tarvikkeet ja tavarat', amount: '3001' },
      { description: 'Laitehankinnat', amount: '9999' },
      { description: 'Palvelut', amount: '1100' },
      { description: 'Vuokrat', amount: '160616' },
      { description: 'Matkamenot', amount: '100' },
      { description: 'Muut menot', amount: '10000000' }
    ]
    expect(sortedFormTable(await hakemustenArviointiPage.changedBudgetTableCells())).toEqual(sortedFormTable(expectedChangedBudget))
    const paatos = await hakemustenArviointiPage.paatosPreviewTalousarvioPaatos()
    expect(paatos).toEqual('Hyväksytään haetut muutokset budjettiin muutettuna')
  })

  bTest('päätös preview when "accepted" is chosen', async ({hakemustenArviointiPage}) => {
    await hakemustenArviointiPage.setMuutoshakemusBudgetDecision('accepted')
    await hakemustenArviointiPage.openPaatosPreview()
    const expectedExistingBudget = [
      { description: 'Henkilöstömenot', amount: '200000 €' },
      { description: 'Aineet, tarvikkeet ja tavarat', amount: '3000 €' },
      { description: 'Laitehankinnat', amount: '10000 €' },
      { description: 'Palvelut', amount: '100 €' },
      { description: 'Vuokrat', amount: '161616 €' },
      { description: 'Matkamenot', amount: '100 €' },
      { description: 'Muut menot', amount: '10000000 €' }
    ]
    const currentValues = await hakemustenArviointiPage.existingBudgetTableCells()
    expect(sortedFormTable(currentValues)).toEqual(sortedFormTable(expectedExistingBudget))
    const expectedChangedBudget = [
      { description: 'Henkilöstömenot', amount: '200100' },
      { description: 'Aineet, tarvikkeet ja tavarat', amount: '4001' },
      { description: 'Laitehankinnat', amount: '8999' },
      { description: 'Palvelut', amount: '100' },
      { description: 'Vuokrat', amount: '161616' },
      { description: 'Matkamenot', amount: '0' },
      { description: 'Muut menot', amount: '10000000' }
    ]
    expect(sortedFormTable(await hakemustenArviointiPage.changedBudgetTableCells())).toEqual(sortedFormTable(expectedChangedBudget))
    const paatos = await hakemustenArviointiPage.paatosPreviewTalousarvioPaatos()
    expect(paatos).toEqual('Hyväksytään haetut muutokset budjettiin')
  })

  bTest('päätös preview when "rejected" is chosen', async ({hakemustenArviointiPage}) => {
    await hakemustenArviointiPage.setMuutoshakemusBudgetDecision('rejected')
    await hakemustenArviointiPage.openPaatosPreview()
    const paatos = await hakemustenArviointiPage.paatosPreviewTalousarvioPaatos()
    expect(paatos).toEqual('Hylätään haetut muutokset budjettiin')
  })
})

