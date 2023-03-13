import * as xlsx from 'xlsx'
import { expect } from '@playwright/test'

import { selvitysTest as test } from '../../fixtures/selvitysTest'
import { VIRKAILIJA_URL } from '../../utils/constants'

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
  expect(workbook.SheetNames).toMatchObject(['Loppuselvitysraportti', 'Asiatarkastamattomat'])
  checkLoppuselvitysraportti(workbook.Sheets['Loppuselvitysraportti'])
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
  expect(workbook.SheetNames).toMatchObject(['Loppuselvitysraportti', 'Asiatarkastamattomat'])
  checkAsiatarkastamattomat(workbook.Sheets['Asiatarkastamattomat'])
})

function checkLoppuselvitysraportti(sheet: xlsx.WorkSheet) {
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
}

function checkAsiatarkastamattomat(sheet: xlsx.WorkSheet) {
  expect(sheet['A1'].v).toEqual('Avustushaku')
  expect(sheet['B1'].v).toEqual('Lukumäärä')
  expect(sheet['C1'].v).toEqual('Valmistelija')

  expect(sheet['A2'].t).toEqual('n')
  expect(sheet['B2'].t).toEqual('n')
  expect(sheet['C2'].t).toEqual('s')

  expect(sheet['A2'].v).toBeGreaterThan(0)
  expect(sheet['B2'].v).toBeGreaterThan(0)
  expect(sheet['C2'].v.length).toBeGreaterThan(0)
}
