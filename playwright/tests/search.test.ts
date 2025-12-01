import { expect } from '@playwright/test'

import { budjettimuutoshakemusTest } from '../fixtures/budjettimuutoshakemusTest'
import { expectToBeDefined } from '../utils/util'
import { HakijaAvustusHakuPage } from '../pages/hakija/hakijaAvustusHakuPage'
import SearchPage from '../pages/virkailija/searchPage'
import { Answers } from '../utils/types'
import { randomString } from '../utils/random'

interface SearchFixtures {
  moreSubmittedHakemuses: { answers2: Answers; answers3: Answers }
}

const budget2 = {
  amount: {
    personnel: '1000',
    material: '1000',
    equipment: '1000',
    'service-purchase': '1000',
    rent: '1000',
    steamship: '1000',
    other: '1000',
  },
  description: {
    personnel: 'a',
    material: 'b',
    equipment: 'c',
    'service-purchase': 'd',
    rent: 'e',
    steamship: 'f',
    other: 'g',
  },
  selfFinancing: '1',
}

const randomStr = randomString()

const test = budjettimuutoshakemusTest.extend<SearchFixtures>({
  moreSubmittedHakemuses: async ({ submittedHakemus, page, avustushakuID, answers }, use) => {
    expectToBeDefined(submittedHakemus)

    const answers2: Answers = {
      ...answers,
      projectName: `Pieni säätö ${randomStr}`,
      contactPersonEmail: 'erkki2.esimerkki@example.com',
      lang: 'sv' as const,
    }

    const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
    await hakijaAvustusHakuPage.navigate(avustushakuID, answers2.lang)
    await hakijaAvustusHakuPage.fillBudjettimuutoshakemusEnabledHakemus(
      avustushakuID,
      '0124610-9',
      answers2,
      budget2
    )
    await hakijaAvustusHakuPage.submitApplication()

    const answers3: Answers = {
      ...answers,
      projectName: `Säätö ${randomStr} jatkuu...`,
      contactPersonEmail: 'erkki3.esimerkki@example.com',
    }
    await hakijaAvustusHakuPage.navigate(avustushakuID, answers3.lang)
    await hakijaAvustusHakuPage.fillBudjettimuutoshakemusEnabledHakemus(
      avustushakuID,
      '0101263-6',
      answers3,
      budget2
    )
    await hakijaAvustusHakuPage.submitApplication()

    await use({ answers2, answers3 })
  },
})

test('Search page', async ({ page, moreSubmittedHakemuses, hakuProps, avustushakuID }) => {
  expectToBeDefined(moreSubmittedHakemuses)

  const searchPage = SearchPage(page)
  await searchPage.navigateToSearchPage()

  await test.step('finds avustushakus by name', async () => {
    await searchPage.search(hakuProps.randomName)
    await expect(searchPage.avustushakuResults.locator('a')).toHaveAttribute(
      'href',
      `/avustushaku/${avustushakuID}/`
    )
    await expect(searchPage.hakemusResults).toHaveCount(0)
  })

  await test.step('finds hakemuses by hanke', async () => {
    await searchPage.search(randomStr)
    await expect(searchPage.avustushakuResults).toHaveCount(0)
    await expect(searchPage.hakemusResults).toHaveCount(2)
  })

  await test.step('finds both by register number', async () => {
    await searchPage.search(hakuProps.registerNumber)
    await expect(searchPage.avustushakuResults.locator('a')).toHaveAttribute(
      'href',
      `/avustushaku/${avustushakuID}/`
    )
    await expect(searchPage.hakemusResults).toHaveCount(3)
  })

  await test.step('sorts current results according to the created-at timestamps', async () => {
    await expect(searchPage.hakemusResults.locator('h2')).toContainText([
      `3/${hakuProps.registerNumber} - Espoon kaupunki`,
      `2/${hakuProps.registerNumber} - Vantaan kaupunki`,
      `1/${hakuProps.registerNumber} - Akaan kaupunki`,
    ])
    await searchPage.setOrder('asc')
    await expect(searchPage.hakemusResults.locator('h2')).toContainText([
      `1/${hakuProps.registerNumber} - Akaan kaupunki`,
      `2/${hakuProps.registerNumber} - Vantaan kaupunki`,
      `3/${hakuProps.registerNumber} - Espoon kaupunki`,
    ])
  })
})
