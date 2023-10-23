import { APIRequestContext, expect } from '@playwright/test'
import { readFileSync } from 'fs'
import * as path from 'path'

import { muutoshakemusTest as test } from '../../fixtures/muutoshakemusTest'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { HakulomakePage } from '../../pages/virkailija/hakujen-hallinta/HakulomakePage'
import { expectToBeDefined } from '../../utils/util'
import { VIRKAILIJA_URL } from '../../utils/constants'

const puuttuvaFinancialPlanJson = readFileSync(
  path.join(__dirname, 'puuttuva-financial-plan.json'),
  'utf8'
)

export async function getMenoluokat(
  avustushakuId: number,
  request: APIRequestContext
): Promise<
  [
    {
      id: string
      'avustushaku-id': string
      type: string
      "translation-fi": string
      "translation-sv": string
      'created-at': string
    },
  ]
> {
  const res = await request.get(
    `${VIRKAILIJA_URL}/api/test/avustushaku/${avustushakuId}/get-menoluokat`,
    { timeout: 10000, failOnStatusCode: true }
  )
  return await res.json()
}

test.describe('Menoluokat', () => {
  test('poistetaan menoluokat-taulusta, mikäli niitä ei löydy lomakkeesta', async ({ avustushakuID, page, hakuProps, userCache }) => {
    expectToBeDefined(userCache)
    const hakujenHallintaPage = new HakujenHallintaPage(page)

    await test.step("Avustushaku on muutoshakukelpoinen", async  () => {
      await hakujenHallintaPage.navigateToFormEditor(avustushakuID)
      const okBannerText = await page.innerText('[data-test-id="validation-ok"]')
      expect(okBannerText).toEqual(
        'Lomake on muutoshakukelpoinenMuutoshakulomake toimitetaan avustuksen saajille automaattisesti päätösviestin yhteydessä'
      )
    })

    await test.step("Avustushaulla on eritellyt menoluokat menoluokka-taulussa", async () => {
      const menoluokat = await getMenoluokat(avustushakuID, page.request)
      expect(menoluokat).toHaveLength(1)
    })

    await hakujenHallintaPage.navigate(avustushakuID)
    const newAvustushakuID = await hakujenHallintaPage.copyCurrentHaku()
    await test.step('Avustushaun lomaketta muutetaan, siten että financial-plan wrapper elementti puttuu', async () => {
      await hakujenHallintaPage.fillAvustushaku(hakuProps)
      const formEditorPage = await hakujenHallintaPage.navigateToFormEditor(newAvustushakuID)
      await formEditorPage.changeLomakeJson(puuttuvaFinancialPlanJson)
      await formEditorPage.saveForm()
    })

    await test.step("Muutettu avustushaku ei ole muutoshakukelpoinen", async  () => {
      const formEditorPage = HakulomakePage(page)
      await expect(formEditorPage.locators.lomakeWarning.nth(1)).toHaveText(
        'Lomakkeesta puuttuu muutoshakemukselle tarpeellinen kenttä. Muutoshaku ei ole mahdollista.'
      )
    })

    await test.step("Avustushaulla on eritellyt menoluokat menoluokka-taulussa", async () => {
      const menoluokat = await getMenoluokat(newAvustushakuID, page.request)
      expect(menoluokat).toHaveLength(0)
    })
  })
})
