import { Download } from 'playwright-core'
import { navigate } from './navigate'
import * as xlsx from 'xlsx'
import { Page } from '@playwright/test'
import type { WorkBook } from 'xlsx'

export async function downloadExcelExport(page: Page, avustushakuID: number) {
  return await downloadExcel(page, `/api/avustushaku/${avustushakuID}/export.xslx`)
}

export async function downloadHallinnoiAvustuksiaExcel(page: Page, avustushakuID: number) {
  return await downloadExcel(page, `/api/avustushaku/${avustushakuID}/hallinnoiavustuksia.xslx`)
}

async function downloadExcel(page: Page, url: string): Promise<WorkBook> {
  const [download]: [Download, any] = await Promise.all([
    page.waitForEvent('download'),
    navigate(page, url).catch((_) => undefined),
  ])

  const path = await download.path()
  if (!path) {
    throw new Error('no download path? wat?')
  }

  return xlsx.readFile(path)
}
