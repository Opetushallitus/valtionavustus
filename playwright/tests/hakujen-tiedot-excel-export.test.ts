import * as xlsx from 'xlsx'
import { expect, Page, test } from '@playwright/test'
import { muutoshakemusTest } from '../fixtures/muutoshakemusTest'
import { expectToBeDefined } from '../utils/util'
import { MaksatuksetPage } from '../pages/hakujen-hallinta/maksatuksetPage'
import moment from 'moment'
import { HakujenHallintaPage } from '../pages/hakujenHallintaPage'

muutoshakemusTest.use({
  acceptDownloads: true,
  hakuProps: ({ hakuProps }, use) =>
    use({
      ...hakuProps,
      arvioituMaksupaiva: new Date('2077-12-17'),
      raportointivelvoitteet: [
        {
          raportointilaji: 'Muu raportti',
          maaraaika: '12.12.2022',
          ashaTunnus: 'VA-260-1',
        },
        {
          raportointilaji: 'Loppuraportti',
          maaraaika: '01.01.2023',
          ashaTunnus: 'VA-260-2',
          lisatiedot: 'hyvää joulua',
        },
      ],
      lainsaadanto: ['Valtionavustuslaki', 'Laki vapaasta sivistystyöstä'],
    }),
})

test.describe.parallel('Excel export of all hakus', () => {
  muutoshakemusTest(
    'for haku that is not closed yet',
    async ({ page, userCache, hakuProps, avustushakuID, talousarviotili }) => {
      expectToBeDefined(userCache)
      expectToBeDefined(avustushakuID)

      const columnValue = await getSheet(page, avustushakuID)

      expect(columnValue('Avustuksen nimi')).toEqual(hakuProps.avustushakuName)
      expect(columnValue('Avustuslaji')).toEqual('erityisavustus')
      expect(columnValue('Koulutusaste 1')).toEqual('Ammatillinen koulutus')
      expect(columnValue('TA-tilit 1')).toEqual(talousarviotili.code)
      expect(columnValue('Raportointivelvoite 1')).toEqual('Muu raportti: VA-260-1, 12.12.2022')
      expect(columnValue('Raportointivelvoite 2')).toEqual(
        'Loppuraportti: VA-260-2, 01.01.2023 (hyvää joulua)'
      )
      expect(columnValue('Haku auki')).toEqual('01.01.1970 00.00')
      expect(columnValue('Haku kiinni')).toEqual(
        `31.12.${hakuProps.hakuaikaEnd.getFullYear()} 23.59`
      )
      expect(columnValue('Asiatunnus')).toEqual(hakuProps.registerNumber)
      expect(columnValue('Vastuuvalmistelija')).toEqual(
        '_ valtionavustus, santeri.horttanainen@reaktor.com'
      )
      expect(columnValue('Maksettu pvm')).toEqual('')
      expect(columnValue('Maksettu €')).toEqual(0)
      expect(columnValue('Arvioitu maksu pvm')).toEqual('17.12.2077')
      expect(columnValue('Lainsäädäntö')).toEqual(
        'Laki vapaasta sivistystyöstä, Valtionavustuslaki'
      )
    }
  )

  muutoshakemusTest(
    'for haku that has maksatukset created',
    async ({ page, userCache, avustushakuID, acceptedHakemus }) => {
      expectToBeDefined(userCache)
      expectToBeDefined(avustushakuID)
      expectToBeDefined(acceptedHakemus)

      const maksatuksetPage = MaksatuksetPage(page)
      await maksatuksetPage.gotoID(avustushakuID)
      await maksatuksetPage.fillMaksueranTiedotAndSendMaksatukset()

      const columnValue = await getSheet(page, avustushakuID)
      const today = moment().format('DD.MM.YYYY')
      expect(columnValue('Maksettu pvm')).toEqual(today)
    }
  )
})

async function getSheet(page: Page, avustushakuID: number) {
  const hakujenHallintaPage = new HakujenHallintaPage(page)
  await hakujenHallintaPage.navigate(avustushakuID)

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('text=Lataa excel').catch((_) => undefined),
  ])
  const path = await download.path()
  if (!path) {
    throw new Error('no download path? wat?')
  }
  const workbook = xlsx.readFile(path)
  expect(workbook.SheetNames).toMatchObject(['Avustushaut'])
  const sheet = workbook.Sheets['Avustushaut']
  expect(sheet.A2.v).toEqual('Haun ID')

  const columnValue = (name: string) => getColumnForAvustushakuRow(sheet, name, avustushakuID)
  return columnValue
}

function getColumnForAvustushakuRow(
  sheet: xlsx.Sheet,
  columnName: string,
  avustushakuID: number
): string {
  const row = findAvustushakuRow(sheet, avustushakuID)
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  const columns = alphabet.concat(alphabet.map((c) => 'A' + c))

  for (const col of columns) {
    const cell = sheet[`${col}2`]
    if (!cell) {
      break
    }
    if (cell.v === columnName) {
      return sheet[`${col}${row}`].v
    }
  }

  throw new Error(`No column ${columnName} found in excel`)
}

function findAvustushakuRow(sheet: xlsx.Sheet, avustushakuID: number): number {
  for (let i = 3; ; i++) {
    const cell = sheet[`A${i}`]
    if (!cell) {
      break
    }
    if (cell.v === avustushakuID) {
      return i
    }
  }

  throw new Error(`Avustushaku ${avustushakuID} row not found in excel`)
}
