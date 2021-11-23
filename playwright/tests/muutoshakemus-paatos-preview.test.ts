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
import {BudgetAmount, sortedFormTable} from "../utils/budget";
import {answers as svAnswers} from "../fixtures/swedishHakemusTest";

const muutoshakemus1: MuutoshakemusValues = {
  jatkoaika: moment(new Date())
    .add(2, 'months')
    .add(1, 'days')
    .locale('fi'),
  jatkoaikaPerustelu: 'Ei kyl millään ehdi deadlineen mennessä ku mun koira söi ne tutkimustulokset'
}

const sisaltomuutosPerustelut = 'Muutamme kaiken muuttamisen ilosta'

const test = muutoshakemusTest.extend<{hakemustenArviointiPage: HakemustenArviointiPage}>({
  hakemustenArviointiPage: async ({hakemus: {hakemusID}, avustushakuID, page}, use) => {
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

test.describe.parallel('muutoshakemus päätös preview', async () => {
  test('has correct basic information', async ({hakemustenArviointiPage}) => {
    await hakemustenArviointiPage.openPaatosPreview()
    expect(await hakemustenArviointiPage.paatosPreviewMuutoshakemusPaatosTitle()).toBe('Päätös')
    const register = await hakemustenArviointiPage.paatosPreviewRegisterNumber()
    expect(register).toMatch(/[0-9]{1,3}\/[0-9]{1,5}\/[0-9]{2,6}/)
    const project = await hakemustenArviointiPage.paatosPreviewProjectName()
    expect(project).toEqual('Rahassa kylpijät Ky Ay Oy')
    const org = await hakemustenArviointiPage.paatosPreviewOrg()
    expect(org).toEqual('Akaan kaupunki')
    const decider = await hakemustenArviointiPage.paatosPreviewHyvaksyja()
    expect(decider).toEqual('_ valtionavustus')
    const info = await hakemustenArviointiPage.paatosPreviewLisatietoja()
    expect(info).toEqual('_ valtionavustussanteri.horttanainen@reaktor.com029 533 1000 (vaihde)')
  })

  test('accepted', async ({hakemustenArviointiPage}) => {
    const decision = 'Hyväksytään haetut muutokset sisältöön ja toteutustapaan'
    await hakemustenArviointiPage.setMuutoshakemusSisaltoDecision('accepted')
    await hakemustenArviointiPage.writePerustelu(decision)
    await hakemustenArviointiPage.openPaatosPreview()
    const acceptedPaatos = await hakemustenArviointiPage.paatosPreviewJatkoaikaPaatos()
    expect(acceptedPaatos).toEqual('Hyväksytään haetut muutokset käyttöaikaan')
    const paatos = await hakemustenArviointiPage.paatosPreviewSisaltoPaatos()
    expect(paatos).toEqual('Hyväksytään haetut muutokset sisältöön ja toteutustapaan')
    const perustelu = await hakemustenArviointiPage.paatosPreviewPerustelu()
    expect(perustelu).toEqual(decision)
  })

  test('rejected', async ({hakemustenArviointiPage}) => {
    await hakemustenArviointiPage.setMuutoshakemusJatkoaikaDecision('rejected')
    await hakemustenArviointiPage.setMuutoshakemusSisaltoDecision('rejected')
    await hakemustenArviointiPage.selectVakioperusteluInFinnish()
    await hakemustenArviointiPage.openPaatosPreview()
    const acceptedPaatos = await hakemustenArviointiPage.paatosPreviewJatkoaikaPaatos()
    expect(acceptedPaatos).toEqual('Hylätään haetut muutokset käyttöaikaan')
    const paatos = await hakemustenArviointiPage.paatosPreviewSisaltoPaatos()
    expect(paatos).toEqual('Hylätään haetut muutokset sisältöön ja toteutustapaan')
    const perustelu = await hakemustenArviointiPage.paatosPreviewPerustelu()
    expect(perustelu).toEqual('Opetushallitus on arvioinut hakemuksen. Opetushallitus on asiantuntija-arvioinnin perusteella ja asiaa harkittuaan päättänyt olla hyväksymättä haettuja muutoksia.')
  })

  test('accepted with changes', async ({hakemustenArviointiPage}) => {
    await hakemustenArviointiPage.setMuutoshakemusJatkoaikaDecision('accepted_with_changes', '20.04.2400')
    const decision = 'Hyväksytään haetut muutokset sisältöön ja toteutustapaan muutettuna'
    await hakemustenArviointiPage.setMuutoshakemusSisaltoDecision('accepted_with_changes')
    await hakemustenArviointiPage.writePerustelu(decision)
    await hakemustenArviointiPage.openPaatosPreview()
    const acceptedPaatos = await hakemustenArviointiPage.paatosPreviewJatkoaikaPaatos()
    expect(acceptedPaatos).toEqual('Hyväksytään haetut muutokset käyttöaikaan muutettuna')
    const acceptedDate = await hakemustenArviointiPage.paatosPreviewJatkoaikaValue()
    expect(acceptedDate).toBe('20.4.2400')
    const paatos = await hakemustenArviointiPage.paatosPreviewSisaltoPaatos()
    expect(paatos).toEqual('Hyväksytään haetut muutokset sisältöön ja toteutustapaan muutettuna')
    const perustelu = await hakemustenArviointiPage.paatosPreviewPerustelu()
    expect(perustelu).toEqual(decision)
  })

})

const bTest = budjettimuutoshakemusTest.extend<BudjettimuutoshakemusFixtures & {hakemustenArviointiPage: HakemustenArviointiPage}>({
  hakemustenArviointiPage: async ({page, hakemus: {hakemusID}, avustushakuID}, use) => {
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

bTest.describe.parallel('budjettimuutoshakemus päätös preview', async () => {

  const budget: BudgetAmount = {
    personnel: '200000',
    material: '3001',
    equipment: '9999',
    'service-purchase': '1100',
    rent: '160616',
    steamship: '100',
    other: '10000000',
  }

  bTest('accepted with changes', async ({hakemustenArviointiPage}) => {
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
    const currentValues = await hakemustenArviointiPage.existingBudgetTableCells('.muutoshakemus-paatos__content [data-test-id="meno-input-row"]')
    expect(sortedFormTable(currentValues)).toEqual(sortedFormTable(expectedExistingBudget))
    const expectedChangedBudget = [
      { description: 'Henkilöstömenot', amount: '200000 €' },
      { description: 'Aineet, tarvikkeet ja tavarat', amount: '3001 €' },
      { description: 'Laitehankinnat', amount: '9999 €' },
      { description: 'Palvelut', amount: '1100 €' },
      { description: 'Vuokrat', amount: '160616 €' },
      { description: 'Matkamenot', amount: '100 €' },
      { description: 'Muut menot', amount: '10000000 €' }
    ]
    expect(sortedFormTable(await hakemustenArviointiPage.changedBudgetTableCells('.muutoshakemus-paatos__content [data-test-id="meno-input-row"]'))).toEqual(sortedFormTable(expectedChangedBudget))
    const paatos = await hakemustenArviointiPage.paatosPreviewTalousarvioPaatos()
    expect(paatos).toEqual('Hyväksytään haetut muutokset budjettiin muutettuna')
  })

  bTest('accepted', async ({hakemustenArviointiPage}) => {
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
    const currentValues = await hakemustenArviointiPage.existingBudgetTableCells('.muutoshakemus-paatos__content [data-test-id="meno-input-row"]')
    expect(sortedFormTable(currentValues)).toEqual(sortedFormTable(expectedExistingBudget))
    const expectedChangedBudget = [
      { description: 'Henkilöstömenot', amount: '200100 €' },
      { description: 'Aineet, tarvikkeet ja tavarat', amount: '4001 €' },
      { description: 'Laitehankinnat', amount: '8999 €' },
      { description: 'Palvelut', amount: '100 €' },
      { description: 'Vuokrat', amount: '161616 €' },
      { description: 'Matkamenot', amount: '0 €' },
      { description: 'Muut menot', amount: '10000000 €' }
    ]
    expect(sortedFormTable(await hakemustenArviointiPage.changedBudgetTableCells('.muutoshakemus-paatos__content [data-test-id="meno-input-row"]'))).toEqual(sortedFormTable(expectedChangedBudget))
    const paatos = await hakemustenArviointiPage.paatosPreviewTalousarvioPaatos()
    expect(paatos).toEqual('Hyväksytään haetut muutokset budjettiin')
  })

  bTest('rejected', async ({hakemustenArviointiPage}) => {
    await hakemustenArviointiPage.setMuutoshakemusBudgetDecision('rejected')
    await hakemustenArviointiPage.openPaatosPreview()
    const paatos = await hakemustenArviointiPage.paatosPreviewTalousarvioPaatos()
    expect(paatos).toEqual('Hylätään haetut muutokset budjettiin')
  })
})

const svJatkoaika = {
  jatkoaika: moment(new Date()).add(1, 'days').locale('fi'),
  jatkoaikaPerustelu: 'Dubbel dubbel-laa'
}

const svTest = muutoshakemusTest.extend<{hakemustenArviointiPage: HakemustenArviointiPage}>({
  answers: async ({}, use) => {
    await use(svAnswers)
  },
  hakemustenArviointiPage: async ({page, hakemus: {hakemusID}, avustushakuID}, use) => {
    const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page)
    await hakijaMuutoshakemusPage.navigate(hakemusID)
    await hakijaMuutoshakemusPage.fillJatkoaikaValues(svJatkoaika)
    await hakijaMuutoshakemusPage.sendMuutoshakemus(true, true)
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    await hakemustenArviointiPage.navigateToLatestMuutoshakemus(avustushakuID, hakemusID)
    await hakemustenArviointiPage.openPaatosPreview()
    await use(hakemustenArviointiPage)
  }
})

svTest('muutoshakemus in swedish päätös preview', async ({hakemustenArviointiPage}) => {

  await test.step('modal title is still in finnish', async () => {
    expect(await hakemustenArviointiPage.paatosPreviewTitle())
      .toBe('ESIKATSELU')
  })

  await test.step('päätös preview content is in swedish', async () => {
    expect(await hakemustenArviointiPage.paatosPreviewMuutoshakemusPaatosTitle())
      .toBe('Beslut')
    expect(await hakemustenArviointiPage.paatosPreviewJatkoaikaPaatos())
      .toBe('De ändringar som ni ansökt om gällande understödets användningstid godkänns')
  })

})
