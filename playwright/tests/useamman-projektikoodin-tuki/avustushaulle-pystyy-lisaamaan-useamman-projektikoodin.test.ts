import { expect } from '@playwright/test'

import { alustaAvustushaunTaytto } from './multiple-projects-util'

import { expectToBeDefined } from '../../utils/util'
import { NoProjectCodeProvided } from '../../utils/types'
import { multipleProjectCodesTest as test } from '../../multipleProjectCodesTest'

test('Avustushaulle pystyy lisäämään useamman projektikoodin', async ({
  page,
  hakuProps,
  userCache,
}, testInfo) => {
  testInfo.setTimeout(testInfo.timeout + 40_000)
  expectToBeDefined(userCache)

  const hakujenHallintaPage = await alustaAvustushaunTaytto(page, hakuProps)

  const firstProjectToSelect = hakuProps.vaCodes.project[1]
  const secondProjectToSelect = hakuProps.vaCodes.project[2]

  await expect(
    page.locator(`[data-test-id='projekti-valitsin-${firstProjectToSelect}']`)
  ).toBeHidden()
  await expect(
    page.locator(`[data-test-id='projekti-valitsin-${secondProjectToSelect}']`)
  ).toBeHidden()

  await hakujenHallintaPage.selectProject(firstProjectToSelect)

  await hakujenHallintaPage.addProjectRow()

  await hakujenHallintaPage.overrideProject(secondProjectToSelect, NoProjectCodeProvided.code)

  await expect(
    page.locator(`[data-test-id='projekti-valitsin-${firstProjectToSelect}']`)
  ).toBeVisible()
  await expect(
    page.locator(`[data-test-id='projekti-valitsin-${secondProjectToSelect}']`)
  ).toBeVisible()
})
