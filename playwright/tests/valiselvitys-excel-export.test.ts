import { expect } from '@playwright/test'
import { expectToBeDefined } from '../utils/util'
import { selvitysTest } from '../fixtures/selvitysTest'
import { downloadExcelExport } from '../utils/downloadExcel'

selvitysTest.use({
  acceptDownloads: true,
})

selvitysTest(
  'Excel export contains väliselvitys sheet',
  async ({ page, avustushakuID, väliselvitysSubmitted }) => {
    expectToBeDefined(väliselvitysSubmitted)

    const workbook = await downloadExcelExport(page, avustushakuID)

    expect(workbook.SheetNames).toMatchObject([
      'Hakemukset',
      'Hakemuksien vastaukset',
      'Väliselvityksien vastaukset',
      'Loppuselvityksien vastaukset',
      'Tiliöinti',
    ])
    const sheet = workbook.Sheets['Väliselvityksien vastaukset']

    expect(sheet.B1.v).toEqual('Hakijaorganisaatio')
    expect(sheet.B2.v).toEqual('Avustuksen saajan nimi')

    expect(sheet.C1.v).toEqual('Hankkeen nimi')
    expect(sheet.C2.v).toEqual('Hankkeen nimi')
  }
)
