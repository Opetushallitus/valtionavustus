import { test, expect } from '@playwright/test'

import { defaultValues } from '../fixtures/defaultValues'
import { HakujenHallintaPage } from '../pages/hakujenHallintaPage'

defaultValues('Copying haku', async ({ page }) => {
  const hakujenHallinta = new HakujenHallintaPage(page)
  const avustushakuID = await hakujenHallinta.copyEsimerkkihaku()

  const valiselvitysTitle = 'Muokattu väliselvityksen otsikko'
  const loppuselvitysTitle = 'Muokattu loppuselvityksen otsikko'

  await setValiselvitysTitleTo(hakujenHallinta, valiselvitysTitle)
  await setLoppuselvitysTitleTo(hakujenHallinta, loppuselvitysTitle)

  await hakujenHallinta.navigate(avustushakuID)
  await hakujenHallinta.copyCurrentHaku()

  await test.step('väliselvitys title is copied to the new avustushaku', async () => {
    await expectValiselvitysTitleToBe(hakujenHallinta, valiselvitysTitle)
  })

  await test.step('loppuselvitys title is copied to the new avustushaku', async () => {
    await expectLoppuselvitysTitleToBe(hakujenHallinta, loppuselvitysTitle)
  })

  await test.step(
    'changing väliselvitys and loppuselvitys on the copied avustushaku does not change the original selvitys values',
    async () => {
      await setValiselvitysTitleTo(hakujenHallinta, `Uudelleen ${valiselvitysTitle.toLowerCase()}`)
      await setLoppuselvitysTitleTo(
        hakujenHallinta,
        `Uudelleen ${loppuselvitysTitle.toLowerCase()}`
      )

      await hakujenHallinta.navigate(avustushakuID)

      await expectValiselvitysTitleToBe(hakujenHallinta, valiselvitysTitle)
      await expectLoppuselvitysTitleToBe(hakujenHallinta, loppuselvitysTitle)
    }
  )
})

async function expectLoppuselvitysTitleToBe(page: HakujenHallintaPage, title: string) {
  const tab = await page.switchToLoppuselvitysTab()
  expect(await tab.getSelvitysTitleFi()).toEqual(title)
}

async function expectValiselvitysTitleToBe(page: HakujenHallintaPage, title: string) {
  const tab = await page.switchToValiselvitysTab()
  expect(await tab.getSelvitysTitleFi()).toEqual(title)
}

async function setValiselvitysTitleTo(page: HakujenHallintaPage, title: string) {
  const tab = await page.switchToValiselvitysTab()
  await tab.setSelvitysTitleFi(title)
}

async function setLoppuselvitysTitleTo(page: HakujenHallintaPage, title: string) {
  const tab = await page.switchToLoppuselvitysTab()
  await tab.setSelvitysTitleFi(title)
}
