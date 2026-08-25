import { expect } from '@playwright/test'
import * as xlsx from 'xlsx'

export function getHakemusAnswerByHeader(
  workbook: xlsx.WorkBook,
  header: string
): string | number | undefined {
  const sheet = workbook.Sheets['Hakemuksien vastaukset']
  expect(sheet, 'Hakemuksien vastaukset sheet').toBeDefined()

  const rows = xlsx.utils.sheet_to_json<Array<string | number | undefined>>(sheet, {
    header: 1,
  })
  const headers = rows[0] ?? []
  const answerRow = rows[1] ?? []
  const columnIndex = headers.indexOf(header)

  expect(columnIndex, `Excel header ${header}`).toBeGreaterThanOrEqual(0)
  return answerRow[columnIndex]
}
