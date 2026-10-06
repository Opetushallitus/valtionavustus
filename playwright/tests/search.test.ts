import { expect } from '@playwright/test'

import { selvitysTest } from '../fixtures/selvitysTest'
import { expectToBeDefined } from '../utils/util'
import { HakijaAvustusHakuPage } from '../pages/hakija/hakijaAvustusHakuPage'
import SearchPage from '../pages/virkailija/searchPage'
import { Answers } from '../utils/types'
import { randomString } from '../utils/random'

const randomStr = randomString()

const test = selvitysTest.extend({
  // Submit the extra hakemuses before the fixture chain closes the avustushaku
  submittedHakemus: async ({ submittedHakemus, page, avustushakuID, answers }, use) => {
    const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
    const submit = async (moreAnswers: Answers, businessId: string) => {
      await hakijaAvustusHakuPage.navigate(avustushakuID, moreAnswers.lang)
      await hakijaAvustusHakuPage.startAndFillApplication(moreAnswers, avustushakuID, businessId)
      await hakijaAvustusHakuPage.fillMuutoshakemusEnabledHakemus(moreAnswers)
      await hakijaAvustusHakuPage.submitApplication()
    }
    await submit(
      {
        ...answers,
        projectName: `Pieni säätö ${randomStr}`,
        contactPersonEmail: 'erkki2.esimerkki@example.com',
        lang: 'sv' as const,
      },
      '0124610-9'
    )
    await submit(
      {
        ...answers,
        projectName: `Säätö ${randomStr} jatkuu...`,
        contactPersonEmail: 'erkki3.esimerkki@example.com',
      },
      '0101263-6'
    )
    await use(submittedHakemus)
  },
})

test('Search page', async ({ page, valiAndLoppuselvitysSubmitted, hakuProps, avustushakuID }) => {
  expectToBeDefined(valiAndLoppuselvitysSubmitted)

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
  await test.step('does not show väli- and loppuselvitys as separate hakemuses', async () => {
    await searchPage.search(`1/${hakuProps.registerNumber}`)
    await expect(searchPage.hakemusResults.locator('h2')).toHaveText([
      `1/${hakuProps.registerNumber} - Akaan kaupunki`,
    ])
  })
})
