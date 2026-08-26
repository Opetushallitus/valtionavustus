import * as xlsx from 'xlsx'
import { expect, Page } from '@playwright/test'

import { selvitysTest as test } from '../../fixtures/selvitysTest'
import { VIRKAILIJA_URL } from '../../utils/constants'
import { getSheetRows } from '../../utils/sheet'
import { muutoshakemusTest } from '../../fixtures/muutoshakemusTest'
import { twoAcceptedHakemusTest } from '../../fixtures/twoHakemusTest'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { RefusePage } from '../../pages/hakija/refuse-page'

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
  const workbook = await getLoppuselvitysraportti(page)
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
      F: 99999,
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
  const workbook = await getLoppuselvitysraportti(page)
  expect(workbook.SheetNames).toMatchObject(SHEET_NAMES)

  await test.step('Asiatarkastamattomat sheet has correct data', () => {
    const sheet = workbook.Sheets['Asiatarkastamattomat']
    expect(sheet['A1'].v).toEqual('Avustushaku')
    expect(sheet['B1'].v).toEqual('Lukumäärä')
    expect(sheet['C1'].v).toEqual('Puuttuu')
    expect(sheet['D1'].v).toEqual('Valmistelija')
    expectToFindRowInSheet(sheet, {
      A: avustushakuID,
      B: 1,
      C: 0,
      D: 'santeri.horttanainen@reaktor.com',
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
      F: 99999,
    })
  })
})

muutoshakemusTest(
  'accepted missing loppuselvitys is included',
  async ({ page, acceptedHakemus, avustushakuID }) => {
    expect(acceptedHakemus).toBeDefined()
    const workbook = await getLoppuselvitysraportti(page)
    const sheet = workbook.Sheets['Asiatarkastamattomat']

    expectToFindRowInSheet(sheet, {
      A: avustushakuID,
      B: 0,
      C: 1,
      D: 'santeri.horttanainen@reaktor.com',
    })
  }
)

muutoshakemusTest(
  'rejected missing loppuselvitys is not included',
  async ({ page, rejectedHakemus, avustushakuID }) => {
    expect(rejectedHakemus).toBeDefined()
    const workbook = await getLoppuselvitysraportti(page)
    const sheet = workbook.Sheets['Asiatarkastamattomat']

    expectRowNotToExistInSheet(sheet, avustushakuID)
  }
)

twoAcceptedHakemusTest(
  'refused grant is excluded from missing loppuselvitys count',
  async ({ page, avustushakuID, acceptedHakemukset: { hakemusID } }) => {
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const haunTiedotPage = await hakujenHallintaPage.navigate(avustushakuID)
    await haunTiedotPage.resolveAvustushaku()
    const paatosPage = await hakujenHallintaPage.commonHakujenHallinta.switchToPaatosTab()
    await paatosPage.sendPaatos(2)

    const refusePage = RefusePage(page)
    await refusePage.navigate(hakemusID)
    await refusePage.refuseGrant()

    const workbook = await getLoppuselvitysraportti(page)
    const sheet = workbook.Sheets['Asiatarkastamattomat']
    expectToFindRowInSheet(sheet, {
      A: avustushakuID,
      B: 0,
      C: 1,
      D: 'santeri.horttanainen@reaktor.com',
    })
  }
)

function expectHakemusSheetHeaders(sheet: xlsx.WorkSheet) {
  expect(sheet['A1'].v).toEqual('Hakemuksen asiatunnus')
  expect(sheet['B1'].v).toEqual('Avustushaun nimi')
  expect(sheet['C1'].v).toEqual('Hakijaorganisaatio')
  expect(sheet['D1'].v).toEqual('Y-tunnus')
  expect(sheet['E1'].v).toEqual('Omistajatyyppi')
  expect(sheet['F1'].v).toEqual('Myönnetty avustus')
}

type AsiatarkastamatonRow = { A: number; B: number; C: number; D: string }
type HakemuksetRow = { A: string; B: string; C: string; D: string; E: string; F: number }
type Row = AsiatarkastamatonRow | HakemuksetRow

function expectToFindRowInSheet(sheet: xlsx.WorkSheet, expectedRow: Row) {
  const sheetRows = getSheetRows(sheet)
  const rows = sheetRows.map((index) => {
    const row = {
      A: sheet[`A${index}`]?.v,
      B: sheet[`B${index}`]?.v,
      C: sheet[`C${index}`]?.v,
      D: sheet[`D${index}`]?.v,
    }
    if ('F' in expectedRow) {
      return {
        ...row,
        E: sheet[`E${index}`]?.v,
        F: sheet[`F${index}`]?.v,
      }
    }
    return row
  })
  expect(rows).toContainEqual(expectedRow)
}

async function getLoppuselvitysraportti(page: Page) {
  const res = await page.request.get(
    `${VIRKAILIJA_URL}/api/v2/reports/loppuselvitykset/loppuselvitysraportti.xlsx`
  )
  expect(res.ok(), `Expected report request to succeed, got ${res.status()}`).toBeTruthy()
  const buffer = await res.body()
  return xlsx.read(buffer)
}

function expectRowNotToExistInSheet(sheet: xlsx.WorkSheet, avustushakuID: number) {
  const avustushakuIDs = getSheetRows(sheet).map((index) => sheet[`A${index}`].v)
  expect(avustushakuIDs).not.toContain(avustushakuID)
}
