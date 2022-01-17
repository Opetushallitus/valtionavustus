import { test } from '@playwright/test'
import { defaultValues } from '../fixtures/defaultValues'
import { HakujenHallintaPage } from '../pages/hakujenHallintaPage'
import * as path from 'path'
import { readFile } from 'fs/promises'
import moment from 'moment'

defaultValues('Tallenna button becomes disabled after save', async ({ page }) => {
  const puuttuvaYhteyshenkilonNimiJson = await readFile(path.join(__dirname, '../fixtures/prod.hakulomake.json'), { encoding: 'utf8' })
  const hakujenHallinta = new HakujenHallintaPage(page)
  const avustushakuID = await hakujenHallinta.copyEsimerkkihaku()
  await hakujenHallinta.setStartDate(moment().subtract(1, 'day'))
  const formEditorPage = await hakujenHallinta.navigateToFormEditor(avustushakuID)

  await test.step('save button is disabled without changes', async () => {
    await page.waitForSelector("#saveForm:disabled")
  })
  await test.step('changing lomake json enables save button', async () => {
    await formEditorPage.changeLomakeJson(puuttuvaYhteyshenkilonNimiJson)
    await page.waitForSelector("#saveForm:not(disabled)")
  })
  await test.step('saving the form disables save butotn', async () => {
    await formEditorPage.saveForm()
    await page.waitForSelector("#saveForm:disabled")
  })
})