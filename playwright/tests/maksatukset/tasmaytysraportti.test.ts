import { APIRequestContext, Download, expect } from '@playwright/test'
import { muutoshakemusTest as test } from '../../fixtures/muutoshakemusTest'
import { VIRKAILIJA_URL } from '../../utils/constants'
import { expectToBeDefined } from '../../utils/util'
import { MaksatuksetPage } from '../../pages/hakujen-hallinta/maksatuksetPage'
import { getPdfFirstPageTextContent } from '../../utils/pdfUtil'

export async function getTasmaytysraporit(
  avustushakuId: number,
  request: APIRequestContext
): Promise<
  [{ 'avustushaku-id': string; contents: string; 'mailed-at': string; mailed_at: string }]
> {
  const res = await request.get(
    `${VIRKAILIJA_URL}/api/test/avustushaku/${avustushakuId}/get-tasmaytysraportti-email`,
    { timeout: 10000, failOnStatusCode: true }
  )
  return await res.json()
}

async function downloadToBuffer(download: Download) {
  const downloadBufs = []
  const stream = await download.createReadStream()
  expectToBeDefined(stream)
  for await (const buf of stream) {
    downloadBufs.push(buf)
  }
  return Buffer.concat(downloadBufs)
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
  const tasmaytysraportti = await getPdfFirstPageTextContent(raportti)
  await test.step('find certain fields in pdf', async () => {
    const lkpTili = '82010000'
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
    const tasmaytysRaporttiPdf = await downloadToBuffer(download)
    const pdfText = await getPdfFirstPageTextContent(tasmaytysRaporttiPdf)
    expect(pdfText).toBe(tasmaytysraportti)
  })
})
