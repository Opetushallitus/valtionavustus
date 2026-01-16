import { expect } from '@playwright/test'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { muutoshakemusTest as test } from '../../fixtures/muutoshakemusTest'
import { HaunTiedotPage } from '../../pages/virkailija/hakujen-hallinta/HaunTiedotPage'

const getIndexInHakuList = async (
  haunTiedotPage: ReturnType<typeof HaunTiedotPage>,
  avustushakuName: string
) => {
  const { hakuList, avustushaku } = haunTiedotPage.common.locators.hakuListingTable
  await expect(hakuList).toBeVisible()
  const rows = await avustushaku.cellValues()
  const defaultAvustushakuName = 'Yleisavustus - esimerkkihaku'
  return {
    defaultAvustushakuIndex: rows.indexOf(defaultAvustushakuName),
    testAvustushakuIndex: rows.indexOf(avustushakuName),
    avustusHakuAmount: rows.length,
  }
}

test('filtering haku table', async ({ avustushakuID, page, hakuProps }) => {
  const { avustushakuName } = hakuProps
  const hakujenHallintaPage = new HakujenHallintaPage(page)
  const haunTiedotPage = await hakujenHallintaPage.navigate(avustushakuID)
  const { avustushaku, tila, vaihe, hakuaika, hakuRows } =
    haunTiedotPage.common.locators.hakuListingTable
  await test.step('filtering with avustushaku name works', async () => {
    const beforeFiltering = await getIndexInHakuList(haunTiedotPage, avustushakuName)
    expect(beforeFiltering.avustusHakuAmount).toBeGreaterThanOrEqual(2)
    expect(beforeFiltering.defaultAvustushakuIndex).toBeGreaterThanOrEqual(0)
    expect(beforeFiltering.testAvustushakuIndex).toBeGreaterThanOrEqual(0)
    await avustushaku.input.fill(avustushakuName)
    await expect(hakuRows).toHaveCount(1)
    const afterFiltering = await getIndexInHakuList(haunTiedotPage, avustushakuName)
    expect(afterFiltering.defaultAvustushakuIndex).toEqual(-1)
    expect(afterFiltering.testAvustushakuIndex).toEqual(0)
    expect(afterFiltering.avustusHakuAmount).toEqual(1)
    await avustushaku.input.fill(avustushakuName.toUpperCase())
    await expect(hakuRows).toHaveCount(1)
    await avustushaku.input.fill('')
    await expect(hakuRows).toHaveCount(beforeFiltering.avustusHakuAmount)
    const afterClearingFilter = await getIndexInHakuList(haunTiedotPage, avustushakuName)
    expect(afterClearingFilter).toEqual(beforeFiltering)
  })
  await test.step('filters with tila', async () => {
    const { toggle, uusiCheckbox } = tila
    await toggle.evaluate((element) => (element as HTMLButtonElement).click())
    await expect(uusiCheckbox).toBeVisible()
    await uusiCheckbox.setChecked(false, { force: true })
    const afterFiltering = await getIndexInHakuList(haunTiedotPage, avustushakuName)
    expect(afterFiltering.defaultAvustushakuIndex).toEqual(-1)
    expect(afterFiltering.testAvustushakuIndex).toBeGreaterThanOrEqual(0)
    await uusiCheckbox.setChecked(true, { force: true })
    const afterClearing = await getIndexInHakuList(haunTiedotPage, avustushakuName)
    expect(afterClearing.defaultAvustushakuIndex).toBeGreaterThanOrEqual(0)
    expect(afterClearing.testAvustushakuIndex).toBeGreaterThanOrEqual(0)
  })
  await test.step('filters with vaihe', async () => {
    const { toggle, kiinniCheckbox } = vaihe
    await toggle.evaluate((element) => (element as HTMLButtonElement).click())
    await expect(kiinniCheckbox).toBeVisible()
    await kiinniCheckbox.setChecked(false, { force: true })
    const afterFiltering = await getIndexInHakuList(haunTiedotPage, avustushakuName)
    expect(afterFiltering.defaultAvustushakuIndex).toEqual(-1)
    expect(afterFiltering.testAvustushakuIndex).toBeGreaterThanOrEqual(0)
    await kiinniCheckbox.setChecked(true, { force: true })
    const afterClearing = await getIndexInHakuList(haunTiedotPage, avustushakuName)
    expect(afterClearing.defaultAvustushakuIndex).toBeGreaterThanOrEqual(0)
    expect(afterClearing.testAvustushakuIndex).toBeGreaterThanOrEqual(0)
  })
  await test.step('filters with hakuaika', async () => {
    const { toggle, hakuaikaStart, hakuaikaEnd, clear } = hakuaika
    await clear.waitFor({ state: 'hidden' })
    await toggle.click()
    const beforeFiltering = await getIndexInHakuList(haunTiedotPage, avustushakuName)
    await hakuaikaStart.fill('17.9.2015')
    await page.keyboard.press('Tab')
    const afterStartFilter = await getIndexInHakuList(haunTiedotPage, avustushakuName)
    expect(afterStartFilter.avustusHakuAmount).toBeLessThan(beforeFiltering.avustusHakuAmount)
    await clear.waitFor()
    await hakuaikaEnd.fill('31.12.2015')
    await page.keyboard.press('Tab')
    const afterBothFilters = await getIndexInHakuList(haunTiedotPage, avustushakuName)
    expect(afterBothFilters.avustusHakuAmount).toEqual(1)
    expect(afterBothFilters.defaultAvustushakuIndex).toEqual(0)
    await clear.click()
    const afterClearing = await getIndexInHakuList(haunTiedotPage, avustushakuName)
    expect(afterClearing.avustusHakuAmount).toEqual(beforeFiltering.avustusHakuAmount)
  })
})
