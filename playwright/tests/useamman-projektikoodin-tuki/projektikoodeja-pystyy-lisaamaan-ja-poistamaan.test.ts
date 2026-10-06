import { expect } from '@playwright/test'

import { multipleProjectCodesTest as test } from '../../multipleProjectCodesTest'

import { alustaAvustushaunTaytto } from './multiple-projects-util'

import { expectToBeDefined } from '../../utils/util'
import { NoProjectCodeProvided } from '../../utils/types'

test('Projektikoodeja pystyy lisäämään ja poistamaan', async ({
  page,
  hakuProps,
  userCache,
}, testInfo) => {
  testInfo.setTimeout(testInfo.timeout + 40_000)
  expectToBeDefined(userCache)

  const haunTiedotPage = await alustaAvustushaunTaytto(page, hakuProps)

  const firstProjectToSelect = hakuProps.vaCodes.project[1]
  const secondProjectToSelect = hakuProps.vaCodes.project[2]
  const firstProject = page.locator(`[data-test-id='projekti-valitsin-${firstProjectToSelect}']`)
  const secondProject = page.locator(`[data-test-id='projekti-valitsin-${secondProjectToSelect}']`)

  await test.step('no projects are selected initially', async () => {
    await expect(firstProject).toBeHidden()
    await expect(secondProject).toBeHidden()
  })

  await test.step('can add multiple projects', async () => {
    await haunTiedotPage.selectProject(firstProjectToSelect)
    await haunTiedotPage.locators.addProject.click()
    await haunTiedotPage.overrideProject(secondProjectToSelect, NoProjectCodeProvided.code)
    await expect(firstProject).toBeVisible()
    await expect(secondProject).toBeVisible()
  })

  await test.step('can remove first project', async () => {
    await haunTiedotPage.locators.removeProject(firstProjectToSelect).click()
    await expect(firstProject).toBeHidden()
    await expect(secondProject).toBeVisible()
  })

  await test.step('can remove second project', async () => {
    await haunTiedotPage.locators.removeProject(secondProjectToSelect).click()
    await expect(firstProject).toBeHidden()
    await expect(secondProject).toBeHidden()
  })
})
