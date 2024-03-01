import { Download } from 'playwright-core'
import { navigate } from './navigate'
import * as xlsx from 'xlsx'
import { Page } from '@playwright/test'
import type { WorkBook } from 'xlsx'
import { HakemustenArviointiPage } from '../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'

export async function downloadExcelExport(page: Page, avustushakuID: number) {
  return await downloadExcel(page, `/api/avustushaku/${avustushakuID}/export.xslx`)
}

export async function downloadHallinnoiAvustuksiaExcel(page: Page, avustushakuID: number) {
  const hakemustenArviointiPage = new HakemustenArviointiPage(page)
  await hakemustenArviointiPage.navigate(avustushakuID)

  const downloadPromise = page.waitForEvent('download')
  await page.getByText('Lataa siirtotiedosto').click()
  return await getWorkbook(await downloadPromise)
}

async function downloadExcel(page: Page, url: string): Promise<WorkBook> {
  const [download]: [Download, any] = await Promise.all([
    page.waitForEvent('download'),
    navigate(page, url).catch((_) => undefined),
  ])

  return getWorkbook(download)
}

async function getWorkbook(download: Download): Promise<WorkBook> {
  const path = await download.path()
  if (!path) {
    throw new Error('no download path? wat?')
  }

  return xlsx.readFile(path)
}
