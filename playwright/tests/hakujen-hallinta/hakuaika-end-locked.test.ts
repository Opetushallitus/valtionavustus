import { expect } from '@playwright/test'
import moment from 'moment-timezone'
import { defaultValues as test } from '../../fixtures/defaultValues'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { HaunTiedotPage } from '../../pages/virkailija/hakujen-hallinta/HaunTiedotPage'
import { VIRKAILIJA_URL } from '../../utils/constants'
import { randomString } from '../../utils/random'
import { expectToBeDefined } from '../../utils/util'

const avustushakuName = `Hakuaika end locked - haku ${randomString()}`

test('hakuaika end time is locked to 23.59 and only the date is editable', async ({
  page,
  hakuProps,
}) => {
  const hakujenHallintaPage = new HakujenHallintaPage(page)
  const haunTiedotPage = HaunTiedotPage(page)
  const hakuaikaEndTime = page.getByTestId('hakuaika-end-time')

  let avustushakuID: number
  await test.step('create a new avustushaku', async () => {
    avustushakuID = await hakujenHallintaPage.copyEsimerkkihaku()
    await hakujenHallintaPage.fillAvustushaku({ ...hakuProps, avustushakuName })
  })

  await test.step('end time is locked to 23.59 on creation', async () => {
    await haunTiedotPage.common.waitForSave()
    await expect(hakuaikaEndTime).toHaveText('klo 23.59')
  })

  const newEndDate = moment().add(2, 'years').format('YYYY-MM-DD')
  await test.step('changing the end date keeps the end time locked to 23.59', async () => {
    await haunTiedotPage.locators.hakuAika.end.fill(newEndDate)
    await haunTiedotPage.locators.hakuAika.end.blur()
    await haunTiedotPage.common.waitForSave()
    await expect(hakuaikaEndTime).toHaveText('klo 23.59')
  })

  await test.step('reloading the page keeps the new date and locked end time', async () => {
    expectToBeDefined(avustushakuID)
    await hakujenHallintaPage.navigate(avustushakuID)
    await expect(haunTiedotPage.locators.hakuAika.end).toHaveValue(newEndDate)
    await expect(hakuaikaEndTime).toHaveText('klo 23.59')
  })
})

const legacyAvustushakuName = `Hakuaika end locked - legacy haku ${randomString()}`

test('a legacy hakuaika keeps its own end time until the date changes', async ({
  page,
  hakuProps,
}) => {
  const hakujenHallintaPage = new HakujenHallintaPage(page)
  const haunTiedotPage = HaunTiedotPage(page)
  const hakuaikaEndTime = page.getByTestId('hakuaika-end-time')

  let avustushakuID: number
  await test.step('create a new avustushaku', async () => {
    avustushakuID = await hakujenHallintaPage.copyEsimerkkihaku()
    await hakujenHallintaPage.fillAvustushaku({
      ...hakuProps,
      avustushakuName: legacyAvustushakuName,
    })
  })

  await test.step('write a legacy end time directly into the database', async () => {
    expectToBeDefined(avustushakuID)
    const res = await page.request.post(`${VIRKAILIJA_URL}/api/test/set-hakuaika-end`, {
      data: { 'avustushaku-id': avustushakuID, end: '2027-12-01T14:15:00.000Z' },
    })
    expect(res.ok()).toBeTruthy()
  })

  await test.step('legacy end time is shown as-is after reload', async () => {
    expectToBeDefined(avustushakuID)
    await hakujenHallintaPage.navigate(avustushakuID)
    await expect(hakuaikaEndTime).toHaveText('klo 16.15')
    await expect(haunTiedotPage.locators.hakuAika.end).toHaveValue('2027-12-01')
  })

  await test.step('saving an unrelated field keeps the legacy end time untouched', async () => {
    await haunTiedotPage.locators.hakuName.fi.fill(`${legacyAvustushakuName} muokattu`)
    await haunTiedotPage.common.waitForSave()

    expectToBeDefined(avustushakuID)
    await hakujenHallintaPage.navigate(avustushakuID)
    await expect(hakuaikaEndTime).toHaveText('klo 16.15')
  })

  await test.step('changing the end date pins the end time to 23.59', async () => {
    await haunTiedotPage.locators.hakuAika.end.fill('2027-12-02')
    await haunTiedotPage.locators.hakuAika.end.blur()
    await haunTiedotPage.common.waitForSave()
    await expect(hakuaikaEndTime).toHaveText('klo 23.59')
  })

  await test.step('the stored end time is pinned to 23:59:59.999 Europe/Helsinki', async () => {
    expectToBeDefined(avustushakuID)
    const res = await page.request.get(`${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}`)
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    const end = body.avustushaku.content.duration.end
    expect(moment.tz(end, 'Europe/Helsinki').format('D.M.YYYY HH:mm:ss.SSS')).toEqual(
      '2.12.2027 23:59:59.999'
    )
  })
})
