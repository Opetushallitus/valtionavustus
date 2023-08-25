import moment from 'moment'
import { expect } from '@playwright/test'
import { budjettimuutoshakemusTest } from '../../fixtures/budjettimuutoshakemusTest'
import { HakemustenArviointiPage } from '../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { HakijaMuutoshakemusPage } from '../../pages/hakija/hakijaMuutoshakemusPage'
import { BudgetAmount, defaultBudget } from '../../utils/budget'
import { MuutoshakemusValues } from '../../utils/types'
import { MuutoshakemusTab } from '../../pages/virkailija/hakemusten-arviointi/MuutoshakemusTab'

const muutoshakemus: MuutoshakemusValues = {
  jatkoaika: moment(new Date()).add(2, 'months').add(1, 'days').locale('fi'),
  jatkoaikaPerustelu:
    'Ei kyl millään ehdi deadlineen mennessä ku mun koira söi ne tutkimustulokset',
}

const sisaltomuutosPerustelut = 'Nyt on pakko pivotoida'

const talousarvio = defaultBudget.amount
const budjettimuutosPerustelut = 'Ajat muuttuu, niin se vaan on'

const test = budjettimuutoshakemusTest.extend<{
  muutoshakemusTab: MuutoshakemusTab
}>({
  muutoshakemusTab: async ({ acceptedHakemus: { hakemusID }, avustushakuID, page }, use) => {
    await test.step('submit muutoshakemus', async () => {
      const hakijaMuutoshakemusPage = new HakijaMuutoshakemusPage(page)
      await hakijaMuutoshakemusPage.navigate(hakemusID)
      await hakijaMuutoshakemusPage.clickHaenSisaltomuutosta()
      await hakijaMuutoshakemusPage.fillSisaltomuutosPerustelut(sisaltomuutosPerustelut)
      await hakijaMuutoshakemusPage.fillJatkoaikaValues(muutoshakemus)
      await hakijaMuutoshakemusPage.clickHaenMuutostaTaloudenKayttosuunnitelmaan()
      await hakijaMuutoshakemusPage.fillTalousarvioValues(talousarvio, budjettimuutosPerustelut)
      await hakijaMuutoshakemusPage.sendMuutoshakemus(true)
    })

    const hakemustenArviointiPage = new HakemustenArviointiPage(page)
    await hakemustenArviointiPage.navigate(avustushakuID)
    await hakemustenArviointiPage.clickHakemus(hakemusID)
    const muutoshakemusTab = await hakemustenArviointiPage.clickMuutoshakemusTab()

    await use(muutoshakemusTab)
  },
})

test.setTimeout(180000)

test('When making a päätös for muutoshakemus, changing the status of other parts should not reset budjetti', async ({
  muutoshakemusTab,
}) => {
  const changedBudgetAmounts: BudgetAmount = {
    ...talousarvio,
    equipment: '10100',
    material: '2900',
  }
  let correctAmounts: { name: string; value: string }[]

  await test.step('fill in amended budget', async () => {
    await muutoshakemusTab.setMuutoshakemusBudgetDecision(
      'accepted_with_changes',
      changedBudgetAmounts
    )
    correctAmounts = await muutoshakemusTab.getAcceptedBudgetInputAmounts()
  })
  await test.step('fill in jatkoaika', async () => {
    await muutoshakemusTab.setMuutoshakemusJatkoaikaDecision('rejected')
    const actualAmounts = await muutoshakemusTab.getAcceptedBudgetInputAmounts()
    expect(actualAmounts).toEqual(correctAmounts)
  })
  await test.step('fill in sisalto', async () => {
    await muutoshakemusTab.setMuutoshakemusSisaltoDecision('rejected')
    const actualAmounts = await muutoshakemusTab.getAcceptedBudgetInputAmounts()
    expect(actualAmounts).toEqual(correctAmounts)
  })
})
