import { MuutoshakemusValues } from '../../utils/types'
import moment from 'moment'
import { muutoshakemusTest } from '../../fixtures/muutoshakemusTest'
import { expect } from '@playwright/test'
import { HakemustenArviointiPage } from '../../pages/hakemustenArviointiPage'
import { HakijaMuutoshakemusPage } from '../../pages/hakijaMuutoshakemusPage'
import {
  BudjettimuutoshakemusFixtures,
  budjettimuutoshakemusTest,
} from '../../fixtures/budjettimuutoshakemusTest'
import { BudgetAmount, sortedFormTable } from '../../utils/budget'
import { svAnswers } from '../../fixtures/swedishHakemusTest'

const muutoshakemus1: MuutoshakemusValues = {
  jatkoaika: moment(new Date()).add(2, 'months').add(1, 'days').locale('fi'),
  jatkoaikaPerustelu:
    'Ei kyl millään ehdi deadlineen mennessä ku mun koira söi ne tutkimustulokset',
}

const sisaltomuutosPerustelut = 'Muutamme kaiken muuttamisen ilosta'

const test = muutoshakemusTest.extend<{
  hakemustenArviointiPage: HakemustenArviointiPage
}>({
  hakemustenArviointiPage: async ({ acceptedHakemus: { hakemusID }, avustushakuID, page }, use) => {
    const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page)
    await hakijaMuutoshakemusPage.navigate(hakemusID)
    await hakijaMuutoshakemusPage.clickHaenSisaltomuutosta()
    await hakijaMuutoshakemusPage.fillSisaltomuutosPerustelut(sisaltomuutosPerustelut)
    await hakijaMuutoshakemusPage.fillJatkoaikaValues(muutoshakemus1)
    await hakijaMuutoshakemusPage.sendMuutoshakemus(true)
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    await hakemustenArviointiPage.navigate(avustushakuID)
    await hakemustenArviointiPage.clickHakemus(hakemusID)
    await hakemustenArviointiPage.clickMuutoshakemusTab()
    await use(hakemustenArviointiPage)
  },
})

test.setTimeout(180000)

test('muutoshakemus päätös preview', async ({ hakemustenArviointiPage }) => {
  const preview = hakemustenArviointiPage.paatosPreview()
  await test.step('has correct basic information', async () => {
    await preview.open()
    await expect(preview.muutoshakemusPaatosTitle).toHaveText('Päätös')
    await expect(preview.projectName).toHaveText('Rahassa kylpijät Ky Ay Oy')
    expect(await preview.registerNumber.textContent()).toMatch(/[0-9]{1,3}\/[0-9]{1,5}\/[0-9]{2,6}/)
    await expect(preview.org).toHaveText('Akaan kaupunki')
    await expect(preview.hyvaksyja).toHaveText('_ valtionavustus')
    await expect(preview.lisatietoja).toHaveText(
      '_ valtionavustussanteri.horttanainen@reaktor.com029 533 1000 (vaihde)'
    )
    await preview.close()
  })

  await test.step('accepted', async () => {
    const decision = 'Hyväksytään haetut muutokset sisältöön ja toteutustapaan'
    await hakemustenArviointiPage.setMuutoshakemusSisaltoDecision('accepted')
    await hakemustenArviointiPage.writePerustelu(decision)
    await preview.open()
    await expect(preview.jatkoaikaPaatos).toHaveText('Hyväksytään haetut muutokset käyttöaikaan')
    await expect(preview.sisaltoPaatos).toHaveText(
      'Hyväksytään haetut muutokset sisältöön ja toteutustapaan'
    )
    await expect(preview.perustelu).toHaveText(decision)
    await preview.close()
  })

  await test.step('rejected', async () => {
    await hakemustenArviointiPage.setMuutoshakemusJatkoaikaDecision('rejected')
    await hakemustenArviointiPage.setMuutoshakemusSisaltoDecision('rejected')
    await hakemustenArviointiPage.selectVakioperusteluInFinnish()
    await preview.open()
    await expect(preview.jatkoaikaPaatos).toHaveText('Hylätään haetut muutokset käyttöaikaan')
    await expect(preview.sisaltoPaatos).toHaveText(
      'Hylätään haetut muutokset sisältöön ja toteutustapaan'
    )
    await expect(preview.perustelu).toHaveText(
      'Opetushallitus on arvioinut hakemuksen. Opetushallitus on asiantuntija-arvioinnin perusteella ja asiaa harkittuaan päättänyt olla hyväksymättä haettuja muutoksia.'
    )
    await preview.close()
  })

  await test.step('accepted with changes', async () => {
    await hakemustenArviointiPage.setMuutoshakemusJatkoaikaDecision(
      'accepted_with_changes',
      '20.04.2400'
    )
    const decision = 'Hyväksytään haetut muutokset sisältöön ja toteutustapaan muutettuna'
    await hakemustenArviointiPage.setMuutoshakemusSisaltoDecision('accepted_with_changes')
    await hakemustenArviointiPage.writePerustelu(decision)
    await preview.open()
    await expect(preview.jatkoaikaPaatos).toHaveText(
      'Hyväksytään haetut muutokset käyttöaikaan muutettuna'
    )
    await expect(preview.jatkoaikaValue).toHaveText('20.4.2400')
    await expect(preview.sisaltoPaatos).toHaveText(
      'Hyväksytään haetut muutokset sisältöön ja toteutustapaan muutettuna'
    )
    await expect(preview.perustelu).toHaveText(decision)
    await preview.close()
  })
})

const bTest = budjettimuutoshakemusTest.extend<
  BudjettimuutoshakemusFixtures & {
    hakemustenArviointiPage: HakemustenArviointiPage
  }
>({
  hakemustenArviointiPage: async ({ page, acceptedHakemus: { hakemusID }, avustushakuID }, use) => {
    const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page)
    await hakijaMuutoshakemusPage.navigate(hakemusID)
    await hakijaMuutoshakemusPage.clickHaenMuutostaTaloudenKayttosuunnitelmaan()
    await hakijaMuutoshakemusPage.fillTalousarvioValues(
      {
        equipment: '8999',
        material: '4001',
        personnel: '200100',
        steamship: '0',
      },
      'perustelu'
    )
    await hakijaMuutoshakemusPage.clickSendMuutoshakemus()
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    await hakemustenArviointiPage.navigateToLatestMuutoshakemus(avustushakuID, hakemusID)
    await use(hakemustenArviointiPage)
  },
})

bTest('budjettimuutoshakemus päätös preview', async ({ hakemustenArviointiPage }) => {
  const budget: BudgetAmount = {
    personnel: '200000',
    material: '3001',
    equipment: '9999',
    'service-purchase': '1100',
    rent: '160616',
    steamship: '100',
    other: '100000',
  }

  const assertCorrectExistingBudget = async () => {
    const expectedExistingBudget = [
      { description: 'Henkilöstömenot', amount: '200000 €' },
      { description: 'Aineet, tarvikkeet ja tavarat', amount: '3000 €' },
      { description: 'Laitehankinnat', amount: '10000 €' },
      { description: 'Palvelut', amount: '100 €' },
      { description: 'Vuokrat', amount: '161616 €' },
      { description: 'Matkamenot', amount: '100 €' },
      { description: 'Muut menot', amount: '100000 €' },
    ]
    const currentValues = await preview.existingBudgetTableCells()
    expect(sortedFormTable(currentValues)).toEqual(sortedFormTable(expectedExistingBudget))
  }

  const preview = hakemustenArviointiPage.paatosPreview()

  await test.step('accepted with changes', async () => {
    await hakemustenArviointiPage.setMuutoshakemusBudgetDecision('accepted_with_changes', budget)
    await preview.open()
    await assertCorrectExistingBudget()
    const expectedChangedBudget = [
      { description: 'Henkilöstömenot', amount: '200000 €' },
      { description: 'Aineet, tarvikkeet ja tavarat', amount: '3001 €' },
      { description: 'Laitehankinnat', amount: '9999 €' },
      { description: 'Palvelut', amount: '1100 €' },
      { description: 'Vuokrat', amount: '160616 €' },
      { description: 'Matkamenot', amount: '100 €' },
      { description: 'Muut menot', amount: '100000 €' },
    ]
    const changedCells = await preview.changedBudgetTableCells()
    expect(sortedFormTable(changedCells)).toEqual(sortedFormTable(expectedChangedBudget))
    await expect(preview.talousarvioPaatos).toHaveText(
      'Hyväksytään haetut muutokset budjettiin muutettuna'
    )
    await preview.close()
  })

  await test.step('accepted', async () => {
    await hakemustenArviointiPage.setMuutoshakemusBudgetDecision('accepted')
    await preview.open()
    await assertCorrectExistingBudget()
    const expectedChangedBudget = [
      { description: 'Henkilöstömenot', amount: '200100 €' },
      { description: 'Aineet, tarvikkeet ja tavarat', amount: '4001 €' },
      { description: 'Laitehankinnat', amount: '8999 €' },
      { description: 'Palvelut', amount: '100 €' },
      { description: 'Vuokrat', amount: '161616 €' },
      { description: 'Matkamenot', amount: '0 €' },
      { description: 'Muut menot', amount: '100000 €' },
    ]
    const changedCells = await preview.changedBudgetTableCells()
    expect(sortedFormTable(changedCells)).toEqual(sortedFormTable(expectedChangedBudget))
    await expect(preview.talousarvioPaatos).toHaveText('Hyväksytään haetut muutokset budjettiin')
    await preview.close()
  })

  await test.step('rejected', async () => {
    await hakemustenArviointiPage.setMuutoshakemusBudgetDecision('rejected')
    await preview.open()
    await expect(preview.talousarvioPaatos).toHaveText('Hylätään haetut muutokset budjettiin')
  })
})

const svJatkoaika = {
  jatkoaika: moment(new Date()).add(1, 'days').locale('fi'),
  jatkoaikaPerustelu: 'Dubbel dubbel-laa',
}

const svTest = muutoshakemusTest.extend<{
  hakemustenArviointiPage: HakemustenArviointiPage
}>({
  answers: svAnswers,
  hakemustenArviointiPage: async ({ page, acceptedHakemus: { hakemusID }, avustushakuID }, use) => {
    const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page)
    await hakijaMuutoshakemusPage.navigate(hakemusID)
    await hakijaMuutoshakemusPage.fillJatkoaikaValues(svJatkoaika)
    await hakijaMuutoshakemusPage.sendMuutoshakemus(true, true)
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    await hakemustenArviointiPage.navigateToLatestMuutoshakemus(avustushakuID, hakemusID)
    await hakemustenArviointiPage.paatosPreview().open()
    await use(hakemustenArviointiPage)
  },
})

svTest('muutoshakemus in swedish päätös preview', async ({ hakemustenArviointiPage }) => {
  const preview = hakemustenArviointiPage.paatosPreview()
  await test.step('modal title is still in finnish', async () => {
    await expect(preview.title).toHaveText('ESIKATSELU')
  })

  await test.step('päätös preview content is in swedish', async () => {
    await expect(preview.muutoshakemusPaatosTitle).toHaveText('Beslut')
    await expect(preview.jatkoaikaPaatos).toHaveText(
      'De ändringar som ni ansökt om gällande understödets användningstid godkänns'
    )
  })
})
