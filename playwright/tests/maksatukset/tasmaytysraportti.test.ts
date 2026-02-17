import { Blob } from 'node:buffer'
import { APIRequestContext, Download, expect, Page } from '@playwright/test'
import { muutoshakemusTest as test } from '../../fixtures/muutoshakemusTest'
import { VIRKAILIJA_URL } from '../../utils/constants'
import { expectToBeDefined } from '../../utils/util'
import { MaksatuksetPage } from '../../pages/virkailija/hakujen-hallinta/maksatuksetPage'
import { getPdfFirstPageTextContent } from '../../utils/pdfUtil'
import { downloadExcelForEmailId } from '../../utils/downloadExcel'
import { getTasmaytysraporttiEmails } from '../../utils/emails'
import { WorkSheet } from 'xlsx'

export async function getTasmaytysraporit(
  avustushakuId: number,
  request: APIRequestContext
): Promise<
  [
    {
      'avustushaku-id': string
      contents: string
      'mailed-at': string
      mailed_at: string
    },
  ]
> {
  const res = await request.get(
    `${VIRKAILIJA_URL}/api/test/avustushaku/${avustushakuId}/get-tasmaytysraportti-email`,
    { timeout: 10000, failOnStatusCode: true }
  )
  return await res.json()
}

async function downloadToBlob(download: Download): Promise<Blob> {
  const downloadBufs: Buffer[] = []
  const stream = await download.createReadStream()
  expectToBeDefined(stream)
  for await (const buf of stream) {
    downloadBufs.push(buf)
  }
  return new Blob(downloadBufs)
}

async function sendTasmaytysraporttiEmail(page: Page) {
  return await page.request.get(`${VIRKAILIJA_URL}/api/test/send-excel-tasmaytysraportti`, {
    failOnStatusCode: true,
  })
}

test('tasmaytysraportti is sent when maksatuset are sent', async ({
  page,
  avustushakuID,
  avustushakuName,
  acceptedHakemus: { hakemusID },
  hakuProps,
}) => {
  expectToBeDefined(hakemusID)
  expectToBeDefined(avustushakuName)

  const tasmaytysraportitBeforeMaksatukset = await getTasmaytysraporit(avustushakuID, page.request)
  expect(tasmaytysraportitBeforeMaksatukset).toHaveLength(0)
  const maksatuksetPage = MaksatuksetPage(page)
  await maksatuksetPage.goto(avustushakuName)
  await maksatuksetPage.fillMaksueranTiedotAndSendMaksatukset()
  await maksatuksetPage.reloadPaymentPage()
  const tasmaytysraportitAfterMaksatukset = await getTasmaytysraporit(avustushakuID, page.request)
  expect(tasmaytysraportitAfterMaksatukset).toHaveLength(1)
  const raportti = Buffer.from(tasmaytysraportitAfterMaksatukset[0].contents, 'base64')
  const tasmaytysraportti = await getPdfFirstPageTextContent(new Blob([raportti]))
  const lkpTili = '82010000'

  await test.step('find certain fields in pdf', async () => {
    const code = hakuProps.talousarviotili.code
    const codeFirstPart = code.slice(0, 10)
    const codeLastPart = code.slice(10)
    const separator = ','
    expect(tasmaytysraportti).toContain(lkpTili)
    expect(tasmaytysraportti).toContain(hakuProps.vaCodes.operationalUnit)
    /*
     these are split to 2 different lines in pdf
     => separate strings separated by ,
     */
    expect(tasmaytysraportti).toContain(`${codeFirstPart}${separator}${codeLastPart}`)
    expect(tasmaytysraportti).toContain(`essi.esittelija@example${separator}.com`)
    expect(tasmaytysraportti).toContain(`hygge.hyvaksyja@exa${separator}mple.com`)
  })
  await test.step('tasmaytysraportti can also be downloaded from maksatukset page', async () => {
    const lahetetytMaksatukset = await maksatuksetPage.clickLahetetytMaksatuksetTab()
    const downloadPromise = page.waitForEvent('download')
    await lahetetytMaksatukset(3).lataaTasmaytysraportti.click()
    const download = await downloadPromise
    await download.path()
    const tasmaytysRaporttiPdf = await downloadToBlob(download)
    const pdfText = await getPdfFirstPageTextContent(tasmaytysRaporttiPdf)
    expect(pdfText).toBe(tasmaytysraportti)

    await test.step('tasmaytysraportti Excel file can be downloaded', async () => {
      const pitkaviite = await lahetetytMaksatukset(1).pitkaviite.innerText()
      async function setPaymentTimeToLastMonth() {
        const url = `${VIRKAILIJA_URL}/api/test/set-excel-tasmaytysraportti-payment-date`
        await page.request.post(url, {
          data: { pitkaviite: pitkaviite },
          failOnStatusCode: true,
        })
      }
      await setPaymentTimeToLastMonth()
      await sendTasmaytysraporttiEmail(page)
      let sheet: WorkSheet
      await expect
        .poll(async () => {
          const emails = await getTasmaytysraporttiEmails()
          const email = emails.at(0)
          expectToBeDefined(email)
          expect(email.subject).toEqual('Edellisen kuukauden VA-täsmäytysraportti')
          expect(email.formatted).toEqual(`Hyvä vastaanottaja,

ohessa VA-järjestelmän automaattisesti luoma VA-maksatusten täsmäytysraportti, joka sisältää kaikki edellisen kalenterikuukauden aikana VA-järjestelmästä tehdyt maksatukset.
`)
          expect(email['to-address']).toEqual(['talouspalvelut@localhost'])
          const workbook = await downloadExcelForEmailId(page, email.id, 'tasmaytysraportti.xlsx')
          expect(workbook.SheetNames).toMatchObject(['Täsmäytysraportti'])
          sheet = workbook.Sheets['Täsmäytysraportti']
          return sheet.A2.v
        })
        .toEqual(avustushakuName)
      expect(sheet!.B2.v).toEqual('Akaan kaupunki')
      expect(sheet!.C2.v).toEqual(hakuProps.talousarviotili.code)
      expect(`${sheet!.D2.v}`).toEqual(lkpTili)
      expect(`${sheet!.E2.v}`).toEqual(hakuProps.vaCodes.project[0])
      expect(sheet!.F2.v).toEqual(`Toimintayksikkö ${hakuProps.vaCodes.operationalUnit}`)
      expect(sheet!.G2.v).toEqual('FI95 6682 9530 0087 65')
      expect(sheet!.H2.v).toEqual(pitkaviite)
      expect(sheet!.I2.v).toEqual(99999)
      expect(sheet!.J2.v).toEqual(`essi.esittelija@example.com`)
      expect(sheet!.K2.v).toEqual(`hygge.hyvaksyja@example.com`)
    })
  })
})
