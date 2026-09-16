import { expect, Page } from '@playwright/test'
import moment from 'moment'
import { defaultValues } from '../../fixtures/defaultValues'
import form from '../../fixtures/prod.hakulomake.json'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { HaunTiedotPage } from '../../pages/virkailija/hakujen-hallinta/HaunTiedotPage'
import { VIRKAILIJA_URL } from '../../utils/constants'
import type { Avustushaku } from '../../../soresu-form/web/va/types'

const test = defaultValues.extend<{ editingHaku: number }>({
  editingHaku: async ({ page, hakuProps, userCache }, use) => {
    expect(userCache).toBeDefined()
    const hallinta = new HakujenHallintaPage(page)
    const { avustushakuID } = await hallinta.createHakuWithLomakeJson(
      JSON.stringify(form),
      hakuProps
    )
    const details = await hallinta.commonHakujenHallinta.switchToHaunTiedotTab()
    await details.common.waitForSave()
    await details.setStartDate(moment().subtract(1, 'year'))
    await details.setEndDate(moment().add(1, 'year').format('D.M.YYYY'))
    await use(avustushakuID)
  },
})

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

// Let the real server save each request, but control when the browser sees its response.
async function holdSaveResponses(page: Page, id: number) {
  const saves: { body: Avustushaku; release: () => void }[] = []
  await page.route(`${VIRKAILIJA_URL}/api/avustushaku/${id}`, async (route) => {
    if (route.request().method() !== 'POST') return route.continue()
    const gate = deferred()
    const response = await route.fetch()
    saves.push({ body: route.request().postDataJSON(), release: gate.resolve })
    await gate.promise
    await route.fulfill({ response })
  })
  return {
    async next(index: number) {
      await expect.poll(() => saves.length).toBeGreaterThan(index)
      return saves[index]
    },
    async dispose() {
      saves.forEach((save) => save.release())
      await page.unrouteAll({ behavior: 'ignoreErrors' })
    },
  }
}

test('an older save cannot undo publication or report newer edits as saved', async ({
  page,
  editingHaku,
}) => {
  const details = HaunTiedotPage(page)
  const saves = await holdSaveResponses(page, editingHaku)
  try {
    await details.locators.hakuName.fi.fill('Autosave publication regression')
    const first = await saves.next(0)
    await details.locators.status.published.click()
    first.release()
    const second = await saves.next(1)

    expect(second.body.status).toBe('published')
    await expect(page.locator('#set-status-published')).toBeChecked()
    await expect(page.getByTestId('save-status').getByText('Tallennetaan')).toBeVisible()

    second.release()
    await details.common.waitForSave()
    await page.reload()
    await expect(page.locator('#set-status-published')).toBeChecked()
    const response = await page.request.get(`${VIRKAILIJA_URL}/api/avustushaku/${editingHaku}`)
    const { avustushaku } = await response.json()
    expect(avustushaku.phase).toBe('current')
  } finally {
    await saves.dispose()
  }
})

test('an older save cannot replace a newly edited deadline', async ({ page, editingHaku }) => {
  const details = HaunTiedotPage(page)
  const saves = await holdSaveResponses(page, editingHaku)
  const tomorrow = moment().add(1, 'day')
  try {
    await details.locators.hakuName.fi.fill('Autosave deadline regression')
    const first = await saves.next(0)
    await details.locators.hakuAika.end.fill(tomorrow.format('D.M.YYYY'))
    await details.locators.hakuAika.end.press('Tab')
    first.release()
    const second = await saves.next(1)

    expect(moment(second.body.content.duration.end).format('YYYY-MM-DD')).toBe(
      tomorrow.format('YYYY-MM-DD')
    )
    await expect(details.locators.hakuAika.end).toHaveValue(tomorrow.format('DD.MM.YYYY'))
    await expect(page.getByTestId('save-status').getByText('Tallennetaan')).toBeVisible()
    second.release()
    await details.common.waitForSave()
    await page.reload()
    await expect(details.locators.hakuAika.end).toHaveValue(tomorrow.format('DD.MM.YYYY'))
    await expect(page.getByTestId('hakuaika-end-time')).toHaveText('klo 23.59')
  } finally {
    await saves.dispose()
  }
})

test('editing both application dates without waiting preserves the whole period', async ({
  page,
  editingHaku,
}) => {
  const details = HaunTiedotPage(page)
  const start = moment().subtract(2, 'days').startOf('day')
  const end = moment().add(1, 'day')
  await details.locators.hakuAika.start.fill(start.format('D.M.YYYY H.mm'))
  await details.locators.hakuAika.end.fill(end.format('D.M.YYYY'))
  await details.locators.hakuAika.end.press('Tab')
  await details.common.waitForSave()
  await page.reload()
  await expect(details.locators.hakuAika.start).toHaveValue(start.format('D.M.YYYY H.mm'))
  await expect(details.locators.hakuAika.end).toHaveValue(end.format('DD.MM.YYYY'))
  const response = await page.request.get(`${VIRKAILIJA_URL}/api/avustushaku/${editingHaku}`)
  const { avustushaku } = await response.json()
  expect(moment(avustushaku.content.duration.end).format('YYYY-MM-DD')).toBe(
    end.format('YYYY-MM-DD')
  )
})
