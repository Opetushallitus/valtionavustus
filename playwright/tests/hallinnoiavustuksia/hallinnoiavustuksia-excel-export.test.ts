import { expect } from '@playwright/test'
import { expectToBeDefined } from '../../utils/util'
import { twoAcceptedHakemusTest } from '../../fixtures/twoHakemusTest'
import { downloadHallinnoiAvustuksiaExcel } from '../../utils/downloadExcel'

twoAcceptedHakemusTest.use({
  acceptDownloads: true,
})

twoAcceptedHakemusTest('Hallinnoiavustuksia.fi Excel export', async ({ page, avustushakuID }) => {
  expectToBeDefined(avustushakuID)

  const firstSheetName = 'VA'
  const workbook = await downloadHallinnoiAvustuksiaExcel(page, avustushakuID)
  expect(workbook.SheetNames).toMatchObject([firstSheetName])
  const sheet = workbook.Sheets[firstSheetName]

  await twoAcceptedHakemusTest.step('produces correct column labels', async () => {
    const columnLabels = {
      A1: 'valtionapuviranomainen',
      B1: 'avustushakuAsianumero',
      C1: 'avustushakuNimi',
      D1: 'avustushakuAvustuslaji',
      E1: 'avustushakuAlkaaPvm',
      F1: 'avustushakuPaattyyPvm',
      G1: 'avustushakuURL',
      H1: 'avustusasiaAsianumero',
      I1: 'avustusasiaVireilletuloPvm',
      J1: 'avustusasiaKieli',
      K1: 'avustusasiaVireillepanijaHenkiloTunnus',
      L1: 'avustusasiaVireillepanijaHenkiloNimi',
      M1: 'avustusasiaVireillepanijaYhteisoTunnus',
      N1: 'avustusasiaVireillepanijaYhteisoNimi',
      O1: 'avustushakemusHaettuKayttotarkoitus',
      P1: 'avustushakemusHaettuAvustus',
      Q1: 'avustushakemusAlueKunnat',
      R1: 'avustushakemusAlueMaakunnat',
      S1: 'avustushakemusAlueHyvinvointialueet',
      T1: 'avustushakemusAlueValtiot',
      U1: 'avustuspaatosPvm',
      V1: 'avustuspaatosPerustelu',
      W1: 'avustuspaatosTyyppi',
      X1: 'avustuspaatosMyonnettyAvustus',
      Y1: 'avustuspaatosHyvaksyttyKayttotarkoitus',
      Z1: 'avustuspaatosKayttoaikaAlkaaPvm',
      AA1: 'avustuspaatosKayttoaikaPaattyyPvm',
      AB1: 'avustuspaatosMaksettuAvustus',
      AC1: 'piilotaKayttotarkoitus',
      AD1: 'piilotaVireillepanija',
    } as const

    for (const key in columnLabels) {
      expect(sheet[key].v).toEqual(columnLabels[key as keyof typeof columnLabels]) // :----)
    }
  })
})