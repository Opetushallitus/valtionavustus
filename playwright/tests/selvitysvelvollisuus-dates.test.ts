import { expectToBeDefined } from '../utils/util'
import { randomString } from '../utils/random'
import { muutoshakemusTest } from '../fixtures/muutoshakemusTest'
import { HakemustenArviointiPage } from '../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { expect } from '@playwright/test'

const test = muutoshakemusTest.extend({
  hakuProps: async ({ hakuProps }, use) => {
    {
      await use({
        ...hakuProps,
        avustushakuName: `Selvityspäivämäärä test - haku ${randomString()}`,
        hankkeenAlkamispaiva: '20.04.1969',
        hankkeenPaattymispaiva: '29.12.1969',
        valiselvitysDeadline: '12.6.2023',
        loppuselvitysDeadline: '12.5.2023',
      })
    }
  },
})
test('Make sure that selvityksen deadline date is formatted in finnish way', async ({
  page,
  userCache,
  submittedHakemus,
  avustushakuID,
  answers,
}) => {
  expectToBeDefined(userCache)
  expectToBeDefined(submittedHakemus)

  const projectName = answers.projectName
  if (!projectName) {
    throw new Error('projectName must be set in order to navigate to hakemus')
  }

  const arviointiPage = new HakemustenArviointiPage(page)
  await arviointiPage.navigateToHakemus(avustushakuID, projectName)
  await arviointiPage.page.getByRole('link', { name: 'Loppuselvitys' }).click()
  await expect(
    arviointiPage.page.getByText(
      `Selvityksen viimeinen toimituspäivämäärä on 12.5.2023 tai 2 kuukautta hankkeen päättymisen jälkeen.`
    )
  ).toBeVisible()

  await arviointiPage.page.getByRole('link', { name: 'Väliselvitys' }).click()
  await expect(
    arviointiPage.page.getByText('Selvityksen viimeinen toimituspäivämäärä on 12.6.2023.')
  ).toBeVisible()
  await expect(
    arviointiPage.page.getByText('tai 2 kuukautta hankkeen päättymisen jälkeen.')
  ).toBeHidden()
})
