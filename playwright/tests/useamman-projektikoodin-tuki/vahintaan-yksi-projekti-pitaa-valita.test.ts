import { expect } from '@playwright/test'
import { multipleProjectCodesTest as test } from '../../multipleProjectCodesTest'

import { alustaAvustushaunTaytto } from './multiple-projects-util'

import { expectToBeDefined } from '../../utils/util'
import { HakemustenArviointiPage } from '../../pages/hakemustenArviointiPage'

test('Vahintaan yksi projekti pitaa valita', async ({
  page,
  hakuProps,
  userCache,
  closedAvustushaku,
  answers,
  codes,
}, testInfo) => {
  testInfo.setTimeout(testInfo.timeout + 40_000)
  expectToBeDefined(userCache)
  expectToBeDefined(closedAvustushaku)
  const hakujenHallintaPage = await alustaAvustushaunTaytto(page, hakuProps)
  await test.step('saving fails with something is wrong as no project code selected', async () => {
    await page.fill('#haku-name-fi', hakuProps.avustushakuName + '-lisays')
    await Promise.all([
      page.locator('text=Tallennetaan').waitFor(),
      page.locator('text=Jossain kentässä puutteita. Tarkasta arvot.').waitFor(),
    ])
  })
  await test.step('saving ok after selecting project code', async () => {
    const firstProjectToSelect = hakuProps.vaCodes.project[1]
    await hakujenHallintaPage.selectProject(firstProjectToSelect)
    await hakujenHallintaPage.waitForSave()
  })
  const hakemustenArviointiPage = new HakemustenArviointiPage(page)
  await hakemustenArviointiPage.navigate(closedAvustushaku.id)
  const { projektikoodi } = await hakemustenArviointiPage.selectHakemusFromList(answers.projectName)
  await test.step('in arviointi project code is not preselected', async () => {
    await hakemustenArviointiPage.waitForSave()
    await expect(projektikoodi.placeholder).toHaveText(
      'Syötä projektikoodi tai valitse "Ei projektikoodia"'
    )
  })
  await test.step('can select project code from multiple options', async () => {
    await projektikoodi.input.click()
    expect(codes.project).toHaveLength(3)
    await expect(projektikoodi.option).toHaveCount(codes.project.length)
    for (let i = 0; i < codes.project.length; i++) {
      await expect(projektikoodi.option.nth(i)).toContainText(codes.project[i])
    }
    await projektikoodi.option.nth(1).click()
    await hakemustenArviointiPage.waitForSave()
    await expect(projektikoodi.value).toContainText(codes.project[1])
  })
})
