import * as xlsx from 'xlsx'
import { expect } from '@playwright/test'

import { selvitysTest as test } from '../../fixtures/selvitysTest'
import { VIRKAILIJA_URL } from '../../utils/constants'
import { getSheetRows } from '../../utils/sheet'

const SHEET_NAMES = ['Loppuselvitysraportti', 'Asiatarkastamattomat', 'Hakemukset']

test('excel contains at least one row after submitting loppuselvitys', async ({
  page,
  loppuselvitysSubmitted: { loppuselvitysFormUrl },
  asiatarkastus: { asiatarkastettu },
  taloustarkastus: { taloustarkastettu },
  hakuProps,
}) => {
  expect(asiatarkastettu)
  expect(taloustarkastettu)
  expect(loppuselvitysFormUrl).toBeDefined()
  const res = await page.request.get(
    `${VIRKAILIJA_URL}/api/v2/reports/loppuselvitykset/loppuselvitysraportti.xlsx`
  )

  const buffer = await res.body()
  const workbook = xlsx.read(buffer)
  expect(workbook.SheetNames).toMatchObject(SHEET_NAMES)

  await test.step('Loppuselvitysraportti sheet has correct data', () => {
    const sheet = workbook.Sheets['Loppuselvitysraportti']
    expect(sheet['A1'].v).toEqual('Vuosi')
    expect(sheet['B1'].v).toEqual('Vastaanotettu')
    expect(sheet['C1'].v).toEqual('Asiatarkastettu')
    expect(sheet['D1'].v).toEqual('Taloustarkastettu')

    // values are numbers
    const year = new Date().getFullYear()
    expect(sheet['A2'].t).toEqual('n')
    expect(sheet['B2'].t).toEqual('n')
    expect(sheet['C2'].t).toEqual('n')
    expect(sheet['D2'].t).toEqual('n')

    // values are correct
    expect(sheet['A2'].v).toEqual(year)

    // values are above 0
    expect(sheet['B2'].v).toBeGreaterThan(0)
    expect(sheet['C2'].v).toBeGreaterThan(0)
    expect(sheet['D2'].v).toBeGreaterThan(0)
  })

  await test.step('Hakemukset sheet has correct data', () => {
    const sheet = workbook.Sheets['Hakemukset']
    expectHakemusSheetHeaders(sheet)
    expectToFindRowInSheet(sheet, {
      A: `1/${hakuProps.registerNumber}`,
      B: hakuProps.avustushakuName,
      C: 'Akaan kaupunki',
      D: '2050864-5',
      E: 'kunta_kirkko',
      F: 'Kainuu',
      G: '',
      H: 99999,
    })
  })
})

test('at least one loppuselvitys is not asiatarkastettu', async ({
  page,
  loppuselvitysSubmitted: { loppuselvitysFormFilled },
  hakuProps,
  avustushakuID,
}) => {
  expect(loppuselvitysFormFilled)
  const res = await page.request.get(
    `${VIRKAILIJA_URL}/api/v2/reports/loppuselvitykset/loppuselvitysraportti.xlsx`
  )

  const buffer = await res.body()
  const workbook = xlsx.read(buffer)
  expect(workbook.SheetNames).toMatchObject(SHEET_NAMES)

  await test.step('Asiatarkastamattomat sheet has correct data', () => {
    const sheet = workbook.Sheets['Asiatarkastamattomat']
    expect(sheet['A1'].v).toEqual('Avustushaku')
    expect(sheet['B1'].v).toEqual('Lukumäärä')
    expect(sheet['C1'].v).toEqual('Valmistelija')
    expectToFindRowInSheet(sheet, {
      A: avustushakuID,
      B: 1,
      C: 'santeri.horttanainen@reaktor.com',
    })
  })

  await test.step('Hakemukset sheet has correct data', () => {
    const sheet = workbook.Sheets['Hakemukset']
    expectHakemusSheetHeaders(sheet)
    expectToFindRowInSheet(sheet, {
      A: `1/${hakuProps.registerNumber}`,
      B: hakuProps.avustushakuName,
      C: 'Akaan kaupunki',
      D: '2050864-5',
      E: 'kunta_kirkko',
      F: 'Kainuu',
      G: '',
      H: 99999,
    })
  })
})

function expectHakemusSheetHeaders(sheet: xlsx.WorkSheet) {
  expect(sheet['A1'].v).toEqual('Hakemuksen asiatunnus')
  expect(sheet['B1'].v).toEqual('Avustushaun nimi')
  expect(sheet['C1'].v).toEqual('Hakijaorganisaatio')
  expect(sheet['D1'].v).toEqual('Y-tunnus')
  expect(sheet['E1'].v).toEqual('Omistajatyyppi')
  expect(sheet['F1'].v).toEqual('Maakunta')
  expect(sheet['G1'].v).toEqual('Hakijan ensisijainen kotikunta')
  expect(sheet['H1'].v).toEqual('Myönnetty avustus')
}

type AsiatarkastamatonRow = { A: number; B: number; C: string }
type HakemuksetRow = {
  A: string
  B: string
  C: string
  D: string
  E: string
  F: string
  G: string
  H: number
}
type Row = AsiatarkastamatonRow | HakemuksetRow

function expectToFindRowInSheet(sheet: xlsx.WorkSheet, expectedRow: Row) {
  const sheetRows = getSheetRows(sheet)
  const rows = sheetRows.map((index) => {
    const row = {
      A: sheet[`A${index}`].v,
      B: sheet[`B${index}`].v,
      C: sheet[`C${index}`].v,
    }
    if ('D' in expectedRow) {
      return {
        ...row,
        D: sheet[`D${index}`].v,
        E: sheet[`E${index}`].v,
        F: sheet[`F${index}`].v,
        G: sheet[`G${index}`].v,
        H: sheet[`H${index}`].v,
      }
    }
    return row
  })
  expect(rows).toContainEqual(expectedRow)
}
