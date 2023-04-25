import * as xlsx from 'xlsx'
import { expect } from '@playwright/test'

import { selvitysTest as test } from '../../fixtures/selvitysTest'
import { VIRKAILIJA_URL } from '../../utils/constants'

const SHEET_NAMES = ['Loppuselvitysraportti', 'Asiatarkastamattomat', 'Hakemukset']

test('excel contains at least one row after submitting loppuselvitys', async ({
  page,
  loppuselvitysSubmitted: { loppuselvitysFormUrl },
  asiatarkastus: { asiatarkastettu },
  taloustarkastus: { taloustarkastettu },
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
  })
})

test('at least one loppuselvitys is not asiatarkastettu', async ({
  page,
  loppuselvitysSubmitted: { loppuselvitysFormFilled },
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

    expect(sheet['A2'].t).toEqual('n')
    expect(sheet['B2'].t).toEqual('n')
    expect(sheet['C2'].t).toEqual('s')

    expect(sheet['A2'].v).toBeGreaterThan(0)
    expect(sheet['B2'].v).toBeGreaterThan(0)
    expect(sheet['C2'].v.length).toBeGreaterThan(0)
  })

  await test.step('Hakemukset sheet has correct data', () => {
    const sheet = workbook.Sheets['Hakemukset']
    expectHakemusSheetHeaders(sheet)
  })

  await test.step('Hakemukset sheet has at least one row', () => {
    const sheet = workbook.Sheets['Hakemukset']
    expect(sheet['A2'].t).toEqual('s')
    expect(sheet['A2'].v.length).toBeGreaterThan(0)
    expect(sheet['B2'].t).toEqual('s')
    expect(sheet['B2'].v.length).toBeGreaterThan(0)
    expect(sheet['C2'].t).toEqual('s')
    expect(sheet['C2'].v.length).toBeGreaterThan(0)
    expect(sheet['D2'].t).toEqual('n')
    expect(sheet['D2'].v).toBeGreaterThan(0)
  })
})

function expectHakemusSheetHeaders(sheet: xlsx.WorkSheet) {
  expect(sheet['A1'].v).toEqual('Hakemuksen asiatunnus')
  expect(sheet['B1'].v).toEqual('Avustushaun nimi')
  expect(sheet['C1'].v).toEqual('Hakijaorganisaatio')
  expect(sheet['D1'].v).toEqual('Myönnetty avustus')
}
