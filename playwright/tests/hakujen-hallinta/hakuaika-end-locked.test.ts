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

  const newEndDate = moment().add(2, 'years')
  await test.step('changing the end date keeps the end time locked to 23.59', async () => {
    await haunTiedotPage.setEndDate(newEndDate.format('D.M.YYYY'))
    await expect(hakuaikaEndTime).toHaveText('klo 23.59')
  })

  await test.step('reloading the page keeps the new date and locked end time', async () => {
    expectToBeDefined(avustushakuID)
    await hakujenHallintaPage.navigate(avustushakuID)
    await expect(haunTiedotPage.locators.hakuAika.end).toHaveValue(newEndDate.format('DD.MM.YYYY'))
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
    await expect(haunTiedotPage.locators.hakuAika.end).toHaveValue('01.12.2027')
  })

  await test.step('saving an unrelated field keeps the legacy end time untouched', async () => {
    await haunTiedotPage.locators.hakuName.fi.fill(`${legacyAvustushakuName} muokattu`)
    await haunTiedotPage.common.waitForSave()

    expectToBeDefined(avustushakuID)
    await hakujenHallintaPage.navigate(avustushakuID)
    await expect(hakuaikaEndTime).toHaveText('klo 16.15')
  })

  await test.step('changing the end date pins the end time to 23.59', async () => {
    await haunTiedotPage.setEndDate('2.12.2027')
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

const durationAvustushakuName = `Hakuaika duration - haku ${randomString()}`

test('hakuaika duration is shown in weeks and days', async ({ page, hakuProps }) => {
  const hakujenHallintaPage = new HakujenHallintaPage(page)
  const haunTiedotPage = HaunTiedotPage(page)
  const duration = page.getByTestId('hakuaika-duration')

  await test.step('create a new avustushaku', async () => {
    await hakujenHallintaPage.copyEsimerkkihaku()
    await hakujenHallintaPage.fillAvustushaku({
      ...hakuProps,
      avustushakuName: durationAvustushakuName,
    })
  })

  await test.step('set a known hakuaika start', async () => {
    await haunTiedotPage.setStartDate(moment('2027-01-01T09:00'))
  })

  await test.step('a whole number of weeks omits the days', async () => {
    await haunTiedotPage.setEndDate('11.2.2027')
    await expect(duration).toHaveText('6 viikkoa')
  })

  await test.step('a partial week is shown after the weeks', async () => {
    await haunTiedotPage.setEndDate('14.2.2027')
    await expect(duration).toHaveText('6 viikkoa 3 päivää')
  })

  await test.step('under a week shows only days', async () => {
    await haunTiedotPage.setEndDate('5.1.2027')
    await expect(duration).toHaveText('5 päivää')
  })

  await test.step('the start and end day both count', async () => {
    await haunTiedotPage.setEndDate('1.1.2027')
    await expect(duration).toHaveText('1 päivä')
  })

  await test.step('a single week uses the singular', async () => {
    await haunTiedotPage.setEndDate('7.1.2027')
    await expect(duration).toHaveText('1 viikko')
  })
})
