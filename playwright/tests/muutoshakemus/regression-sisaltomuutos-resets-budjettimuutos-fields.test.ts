import moment from 'moment'
import { expect } from '@playwright/test'
import { budjettimuutoshakemusTest } from '../../fixtures/budjettimuutoshakemusTest'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { HakijaMuutoshakemusPage } from '../../pages/hakija/hakijaMuutoshakemusPage'
import { BudgetAmount, defaultBudget } from '../../utils/budget'
import { MuutoshakemusValues } from '../../utils/types'

const muutoshakemus: MuutoshakemusValues = {
  jatkoaika: moment(new Date()).add(2, 'months').add(1, 'days').locale('fi'),
  jatkoaikaPerustelu:
    'Ei kyl millään ehdi deadlineen mennessä ku mun koira söi ne tutkimustulokset',
}

const sisaltomuutosPerustelut = 'Nyt on pakko pivotoida'

const talousarvio = defaultBudget.amount
const budjettimuutosPerustelut = 'Ajat muuttuu, niin se vaan on'

const test = budjettimuutoshakemusTest.extend<{
  hakemustenArviointiPage: HakemustenArviointiPage
}>({
  hakemustenArviointiPage: async ({ acceptedHakemus: { hakemusID }, avustushakuID, page }, use) => {
    const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page)
    await hakijaMuutoshakemusPage.navigate(hakemusID)
    await hakijaMuutoshakemusPage.clickHaenSisaltomuutosta()
    await hakijaMuutoshakemusPage.fillSisaltomuutosPerustelut(sisaltomuutosPerustelut)
    await hakijaMuutoshakemusPage.fillJatkoaikaValues(muutoshakemus)
    await hakijaMuutoshakemusPage.clickHaenMuutostaTaloudenKayttosuunnitelmaan()
    await hakijaMuutoshakemusPage.fillTalousarvioValues(talousarvio, budjettimuutosPerustelut)
    await hakijaMuutoshakemusPage.sendMuutoshakemus(true)
    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    await hakemustenArviointiPage.navigate(avustushakuID)
    await hakemustenArviointiPage.clickHakemus(hakemusID)
    await hakemustenArviointiPage.clickMuutoshakemusTab()
    await use(hakemustenArviointiPage)
  },
})

test.setTimeout(180000)

test('When making a päätös for muutoshakemus, changing the status of other parts should not reset budjetti', async ({
  hakemustenArviointiPage,
}) => {
  const changedBudgetAmounts: BudgetAmount = {
    ...talousarvio,
    equipment: '10100',
    material: '2900',
  }
  let correctAmounts: { name: string; value: string }[]

  await test.step('fill in amended budget', async () => {
    await hakemustenArviointiPage.setMuutoshakemusBudgetDecision(
      'accepted_with_changes',
      changedBudgetAmounts
    )
    correctAmounts = await hakemustenArviointiPage.getAcceptedBudgetInputAmounts()
  })
  await test.step('fill in jatkoaika', async () => {
    await hakemustenArviointiPage.setMuutoshakemusJatkoaikaDecision('rejected')
    const actualAmounts = await hakemustenArviointiPage.getAcceptedBudgetInputAmounts()
    expect(actualAmounts).toEqual(correctAmounts)
  })
  await test.step('fill in sisalto', async () => {
    await hakemustenArviointiPage.setMuutoshakemusSisaltoDecision('rejected')
    const actualAmounts = await hakemustenArviointiPage.getAcceptedBudgetInputAmounts()
    expect(actualAmounts).toEqual(correctAmounts)
  })
})
