import { expect } from '@playwright/test'

import {
  BudjettimuutoshakemusFixtures,
  budjettimuutoshakemusTest,
} from '../../fixtures/budjettimuutoshakemusTest'
import { HakijaMuutoshakemusPage } from '../../pages/hakijaMuutoshakemusPage'
import { HakemustenArviointiPage } from '../../pages/hakemustenArviointiPage'
import moment from 'moment'
import { Budget, BudgetAmount, sortedFormTable } from '../../utils/budget'
import { parseMuutoshakemusPaatosFromEmails } from '../../utils/emails'
import { HakijaMuutoshakemusPaatosPage } from '../../pages/hakijaMuutoshakemusPaatosPage'
import { svBudjettimuutoshakemusTest } from '../../fixtures/swedishHakemusTest'

const budget: Budget = {
  amount: {
    personnel: '300',
    material: '420',
    equipment: '1337',
    'service-purchase': '5318008',
    rent: '69',
    steamship: '0',
    other: '9000',
  },
  description: {
    personnel: 'One euro for each of our Spartan workers',
    material: 'Generic materials for innovation',
    equipment: 'We need elite level equipment',
    'service-purchase': 'We need some afterwork fun',
    rent: 'More afterwork fun',
    steamship: 'No need for steamship, we have our own yacht',
    other: 'For power ups',
  },
  selfFinancing: '1',
}

const budgetWithFinnishThousandSeparator: Budget = {
  amount: {
    personnel: '300',
    material: '420',
    equipment: '1 337',
    'service-purchase': '5 318 008',
    rent: '69',
    steamship: '0',
    other: '9 000',
  },
  description: budget.description,
  selfFinancing: budget.selfFinancing,
}

const jatkoaika = {
  jatkoaika: moment(new Date()).add(1, 'days').locale('fi'),
  jatkoaikaPerustelu: 'Duubiduubi-laa',
}

const muutoshakemus1Budget: BudgetAmount = {
  personnel: '301',
  material: '421',
  equipment: '1338',
  'service-purchase': '5318007',
  rent: '68',
  steamship: '0',
  other: '8999',
}

const muutoshakemus1Perustelut =
  'Pitäis päästä poistaa jotain akuuttii.... koodaile jotai jos mitää ois poistaa palaillaa sit mo'

const acceptedMuutoshakemusBudget: BudgetAmount = {
  personnel: '1301',
  material: '1421',
  equipment: '2338',
  'service-purchase': '5312007',
  rent: '1068',
  steamship: '1000',
  other: '9999',
}

const test = budjettimuutoshakemusTest.extend<
  BudjettimuutoshakemusFixtures & {
    hakijaMuutoshakemusPaatosPage: HakijaMuutoshakemusPaatosPage
  }
>({
  budget,
  acceptedBudget: budgetWithFinnishThousandSeparator,
  hakijaMuutoshakemusPaatosPage: async (
    { page, acceptedHakemus: { hakemusID }, avustushakuID, hakuProps, answers },
    use
  ) => {
    const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page)
    await hakijaMuutoshakemusPage.navigate(hakemusID)
    await hakijaMuutoshakemusPage.fillJatkoaikaValues(jatkoaika)
    await hakijaMuutoshakemusPage.clickHaenMuutostaTaloudenKayttosuunnitelmaan()
    await test.step(
      'Current budget is shown',
      hakijaMuutoshakemusPage.expectApprovedBudgetToBe(page, budget.amount)
    )
    await hakijaMuutoshakemusPage.fillTalousarvioValues(
      muutoshakemus1Budget,
      muutoshakemus1Perustelut
    )
    await hakijaMuutoshakemusPage.clickSendMuutoshakemus()
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    await hakemustenArviointiPage.navigateToLatestMuutoshakemus(avustushakuID, hakemusID)
    await hakemustenArviointiPage.setMuutoshakemusJatkoaikaDecision(
      'accepted_with_changes',
      '01.01.2099'
    )
    await hakemustenArviointiPage.setMuutoshakemusBudgetDecision(
      'accepted_with_changes',
      acceptedMuutoshakemusBudget
    )
    await hakemustenArviointiPage.selectVakioperusteluInFinnish()
    await hakemustenArviointiPage.saveMuutoshakemus()
    const links = await parseMuutoshakemusPaatosFromEmails(hakemusID)
    if (!links.linkToMuutoshakemusPaatos) {
      throw Error('No linkToMuutoshakemusPaatos found')
    }
    await test.step('email has correct title', async () => {
      expect(links.title).toContain(`${hakuProps.registerNumber} - ${answers.projectName}`)
    })
    await test.step('email has link to päätös', async () => {
      expect(links.linkToMuutoshakemusPaatos).toMatch(
        /https?:\/\/[^\/]+\/muutoshakemus\/paatos\?user-key=[a-f0-9]{64}/
      )
    })
    await test.step('email has link to muutoshakemus', async () => {
      expect(links.linkToMuutoshakemus).toMatch(/https?:\/\/[^\/]+\/muutoshakemus\?.*/)
    })
    const hakijaMuutoshakemusPaatosPage = new HakijaMuutoshakemusPaatosPage(page)
    await hakijaMuutoshakemusPaatosPage.navigate(links.linkToMuutoshakemusPaatos)
    await use(hakijaMuutoshakemusPaatosPage)
  },
})

test.setTimeout(180000)

test('Hakija views muutoshakemus page', async ({ hakijaMuutoshakemusPaatosPage }) => {
  await test.step('Decision title is shown in finnish', async () => {
    const title = await hakijaMuutoshakemusPaatosPage.title()
    expect(title).toEqual('Päätös')
  })

  await test.step('budget decision is shown', async () => {
    expect(await hakijaMuutoshakemusPaatosPage.talousarvioPaatos()).toEqual(
      'Hyväksytään haetut muutokset budjettiin muutettuna'
    )
  })

  await test.step('Current budget title is shown in finnish', async () => {
    expect(await hakijaMuutoshakemusPaatosPage.currentBudgetTitle()).toEqual('Vanha budjetti')
  })

  await test.step('Approved budget title is shown in finnish', async () => {
    expect(await hakijaMuutoshakemusPaatosPage.currentBudgetHeader()).toEqual(
      'Hyväksytty uusi budjetti'
    )
  })

  await test.step('Jatkoaika decision is shown', async () => {
    expect(await hakijaMuutoshakemusPaatosPage.jatkoaikaPaatos()).toEqual(
      'Hyväksytään haetut muutokset käyttöaikaan muutettuna'
    )
  })

  await test.step('Päätöksen perustelut title is shown in finnish', async () => {
    expect(await hakijaMuutoshakemusPaatosPage.paatoksetPerustelutTitle()).toEqual(
      'Päätöksen perustelut'
    )
  })

  await test.step('päätöksen perustelut is shown', async () => {
    expect(await hakijaMuutoshakemusPaatosPage.paatoksenPerustelut()).toEqual(
      'Opetushallitus on arvioinut hakemuksen. Opetushallitus on asiantuntija-arvioinnin perusteella ja asiaa harkittuaan päättänyt hyväksyä haetut muutokset muutettuna, siten kuin ne kuvataan tässä avustuspäätöksessä.'
    )
  })

  await test.step('Päätöksen tekijä is shown in finnish', async () => {
    expect(await hakijaMuutoshakemusPaatosPage.paatoksetTekija()).toEqual('Hyväksyjä')
  })

  await test.step('Lisätietoja title is shown in finnish', async () => {
    expect(await hakijaMuutoshakemusPaatosPage.lisatietojaTitle()).toEqual('Lisätietoja')
  })

  await test.step('budget change is mentioned in the info section', async () => {
    expect(await hakijaMuutoshakemusPaatosPage.infoSection()).toEqual(
      'Muutoshakemus talouden käyttösuunnitelmaan.'
    )
  })

  await test.step('the old budget is shown on the päätös', async () => {
    const budgetExpectedItems = [
      { description: 'Henkilöstömenot', amount: '300 €' },
      { description: 'Aineet, tarvikkeet ja tavarat', amount: '420 €' },
      { description: 'Laitehankinnat', amount: '1337 €' },
      { description: 'Palvelut', amount: '5318008 €' },
      { description: 'Vuokrat', amount: '69 €' },
      { description: 'Matkamenot', amount: '0 €' },
      { description: 'Muut menot', amount: '9000 €' },
    ]
    const currentValues = await hakijaMuutoshakemusPaatosPage.existingBudgetTableCells()
    expect(sortedFormTable(currentValues)).toEqual(sortedFormTable(budgetExpectedItems))
  })

  await test.step('the "accepted with changes" budget is shown on the päätös', async () => {
    const budgetExpectedItems = [
      { description: 'Henkilöstömenot', amount: '1301 €' },
      { description: 'Aineet, tarvikkeet ja tavarat', amount: '1421 €' },
      { description: 'Laitehankinnat', amount: '2338 €' },
      { description: 'Palvelut', amount: '5312007 €' },
      { description: 'Vuokrat', amount: '1068 €' },
      { description: 'Matkamenot', amount: '1000 €' },
      { description: 'Muut menot', amount: '9999 €' },
    ]
    const currentValues = await hakijaMuutoshakemusPaatosPage.changedBudgetTableCells()
    expect(sortedFormTable(currentValues)).toEqual(sortedFormTable(budgetExpectedItems))
  })
})

export const svBudget: Budget = {
  amount: {
    personnel: '300',
    material: '420',
    equipment: '1337',
    'service-purchase': '5318008',
    rent: '69',
    steamship: '0',
    other: '9000',
  },
  description: {
    personnel: 'tjänare',
    material: 'båterna',
    equipment: 'champagne visp',
    'service-purchase': 'servitörena',
    rent: 'villa',
    steamship: 'ånga',
    other: 'Kalle Anka',
  },
  selfFinancing: '1',
}

const svMuutoshakemusBudget = {
  ...budget.amount,
  personnel: '299',
  material: '421',
}

const svMuutoshakemusPerustelut =
  'Ska få ta bort något akut .... koda något om något ois ta bort bit sit mo'

const svJatkoaika = {
  jatkoaika: moment(new Date()).add(1, 'days').locale('fi'),
  jatkoaikaPerustelu: 'Dubbel dubbel-laa',
}

const svTest = svBudjettimuutoshakemusTest.extend<{
  hakijaMuutoshakemusPaatosPage: HakijaMuutoshakemusPaatosPage
}>({
  budget: svBudget,
  hakijaMuutoshakemusPaatosPage: async (
    { page, avustushakuID, acceptedHakemus: { hakemusID } },
    use
  ) => {
    const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page)
    await hakijaMuutoshakemusPage.navigate(hakemusID)
    await hakijaMuutoshakemusPage.fillJatkoaikaValues(svJatkoaika)
    await hakijaMuutoshakemusPage.clickHaenMuutostaTaloudenKayttosuunnitelmaan()
    await hakijaMuutoshakemusPage.fillTalousarvioValues(
      svMuutoshakemusBudget,
      svMuutoshakemusPerustelut
    )
    await hakijaMuutoshakemusPage.sendMuutoshakemus(true, true)
    const acceptedBudget: BudgetAmount = {
      personnel: '1301',
      material: '1421',
      equipment: '2338',
      'service-purchase': '5312007',
      rent: '1068',
      steamship: '1000',
      other: '9999',
    }
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    await hakemustenArviointiPage.navigateToLatestMuutoshakemus(avustushakuID, hakemusID)
    await hakemustenArviointiPage.setMuutoshakemusBudgetDecision(
      'accepted_with_changes',
      acceptedBudget
    )
    await hakemustenArviointiPage.setMuutoshakemusJatkoaikaDecision(
      'accepted_with_changes',
      '01.01.2099'
    )
    await hakemustenArviointiPage.selectVakioperusteluInFinnish()
    await hakemustenArviointiPage.saveMuutoshakemus()
    const links = await parseMuutoshakemusPaatosFromEmails(hakemusID)
    if (!links.linkToMuutoshakemusPaatos) {
      throw Error('No linkToMuutoshakemusPaatos found')
    }
    const hakijaMuutoshakemusPaatosPage = new HakijaMuutoshakemusPaatosPage(page)
    await hakijaMuutoshakemusPaatosPage.navigate(links.linkToMuutoshakemusPaatos)
    await use(hakijaMuutoshakemusPaatosPage)
  },
})

svTest('Hakija views swedish muutoshakemus paatos', async ({ hakijaMuutoshakemusPaatosPage }) => {
  await svTest.step('Decision title is shown in swedish', async () => {
    const title = await hakijaMuutoshakemusPaatosPage.title()
    expect(title).toEqual('Beslut')
  })

  await svTest.step('jatkoaika decision is shown in swedish', async () => {
    const title = await hakijaMuutoshakemusPaatosPage.jatkoaikaPaatos()
    expect(title).toEqual(
      'De ändringar som ni ansökt om gällande understödets användningstid godkänns med vissa ändringar'
    )
  })

  await svTest.step('budget decision is shown in swedish', async () => {
    const title = await hakijaMuutoshakemusPaatosPage.talousarvioPaatos()
    expect(title).toEqual('De ändringar som ni ansökt om i budgeten godkänns med vissa ändringar')
  })

  await svTest.step('current budget title is shown in swedish', async () => {
    const currentBudgetHeader = await hakijaMuutoshakemusPaatosPage.currentBudgetTitle()
    expect(currentBudgetHeader).toEqual('Den tidigare budgeten')
  })

  await svTest.step('päätöksen perustelut is shown in swedish', async () => {
    const currentBudgetHeader = await hakijaMuutoshakemusPaatosPage.paatoksetPerustelutTitle()
    expect(currentBudgetHeader).toEqual('Motiveringar för beslutet')
  })

  await svTest.step('päätöksen tekijä is shown in swedish', async () => {
    const currentBudgetHeader = await hakijaMuutoshakemusPaatosPage.paatoksetTekija()
    expect(currentBudgetHeader).toEqual('Har godkänts av')
  })

  await svTest.step('lisätietoja title is shown in swedish', async () => {
    const currentBudgetHeader = await hakijaMuutoshakemusPaatosPage.lisatietojaTitle()
    expect(currentBudgetHeader).toEqual('Mer information')
  })

  await svTest.step('budget change is mentioned in the info section', async () => {
    const budgetChangeText = await hakijaMuutoshakemusPaatosPage.infoSection()
    expect(budgetChangeText).toEqual('Ändringsansökan som gäller projektets budget')
  })

  await svTest.step('Budget rows are in Swedish', async () => {
    const budgetRows = await hakijaMuutoshakemusPaatosPage.existingBudgetTableCells()
    const swedishBudgetRowDescriptions = budgetRows.map((s) => s.description)
    const swedishBudgetRowNames = [
      'Personalkostnader',
      'Material, utrustning och varor',
      'Anskaffning av utrustning',
      'Tjänster',
      'Hyror',
      'Resekostnader',
      'Övriga kostnader',
    ]
    expect(swedishBudgetRowDescriptions.sort()).toEqual(swedishBudgetRowNames.sort())
  })
})
