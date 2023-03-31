import { APIRequestContext, expect } from '@playwright/test'
import { muutoshakemusTest as test } from '../../fixtures/muutoshakemusTest'
import { VIRKAILIJA_URL } from '../../utils/constants'
import { expectToBeDefined } from '../../utils/util'
import { MaksatuksetPage } from '../../pages/hakujen-hallinta/maksatuksetPage'

export async function getTasmaytysraporit(
  avustushakuId: number,
  request: APIRequestContext
): Promise<[{ 'avustushaku-id': string; 'mailed-at': string; mailed_at: string }]> {
  const res = await request.get(
    `${VIRKAILIJA_URL}/api/test/avustushaku/${avustushakuId}/get-tasmaytysraportti-email`,
    { timeout: 10000, failOnStatusCode: true }
  )
  return await res.json()
}

test('tasmaytysraportti is sent when maksatuset are sent', async ({
  page,
  avustushakuID,
  avustushakuName,
  acceptedHakemus: { hakemusID },
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
})
