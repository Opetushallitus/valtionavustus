import * as xlsx from 'xlsx'
import { expect } from '@playwright/test'

export function getSheetRows(sheet: xlsx.WorkSheet) {
  const range = xlsx.utils.decode_range(sheet['!ref']!)
  const numberOfRows = range.e.r - range.s.r + 1
  return Array.from({ length: numberOfRows }, (_, i) => i + 1)
}

type RowKey = `${string}${number}` | `${string}${string}${number}`

export type SheetRow = Record<RowKey, string | number | boolean | Date>

export function expectToFindRowWithValuesInSheet(sheet: xlsx.WorkSheet, expectedRows: SheetRow[]) {
  const rowCellValuesFromSheet = expectedRows.reduce<SheetRow[]>((acc, row) => {
    const keys = Object.keys(row)
    const rowValues: SheetRow = {}
    for (const cell of keys) {
      rowValues[cell as keyof SheetRow] = sheet[cell].v
    }
    acc.push(rowValues)
    return acc
  }, [])
  for (const expectedRow of expectedRows) {
    expect(rowCellValuesFromSheet).toContainEqual(expectedRow)
  }
}
