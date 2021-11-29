import {expect} from "@playwright/test"
import { Page } from "playwright"
import { URLSearchParams } from "url"

import {hakemusTest as test} from "../fixtures/hakemusTest"
import {HakemustenArviointiPage} from "../pages/hakemustenArviointiPage"
import {HakujenHallintaPage} from "../pages/hakujenHallintaPage"
import { waitForElementWithText } from "../utils/util"

test.setTimeout(180000)

test('virkailija can edit hakemus', async ({page, avustushakuID}) => {
  const hakemustenArviointiPage = new HakemustenArviointiPage(page)

  const assertTokens = (assertedPage: Page) => {
    const tokens = new URLSearchParams(assertedPage.url())
    expect(!!tokens.get('officerToken')).toBeTruthy()
    expect(!!tokens.get('officerHash')).toBeTruthy()
  }
  
  await test.step('when hakemus has been submitted', async () => {
    await hakemustenArviointiPage.navigateToLatestHakemusArviointi(avustushakuID)
    const hakemusPage = await hakemustenArviointiPage.openHakemusEditPage()

    assertTokens(hakemusPage.page)
    await hakemusPage.selectMaakuntaFromDropdown('Itä-Uusimaa')
    await hakemusPage.submitOfficerEdit()

    await hakemustenArviointiPage.page.bringToFront()
    await hakemustenArviointiPage.navigateToLatestHakemusArviointi(avustushakuID)
    await waitForElementWithText(page, 'span', 'Itä-Uusimaa')
  })
  
  await test.step('when the avustushaku has been closed', async () => {
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    await hakujenHallintaPage.navigate(avustushakuID)
    await hakujenHallintaPage.closeAvustushakuByChangingEndDateToPast()
    
    await hakemustenArviointiPage.navigateToLatestHakemusArviointi(avustushakuID)
    const hakemusPage = await hakemustenArviointiPage.openHakemusEditPage()

    assertTokens(hakemusPage.page)
    await hakemusPage.selectMaakuntaFromDropdown('Etelä-Savo')
    await hakemusPage.submitOfficerEdit()

    await hakemustenArviointiPage.page.bringToFront()
    await hakemustenArviointiPage.navigateToLatestHakemusArviointi(avustushakuID)
    await waitForElementWithText(page, 'span', 'Etelä-Savo')
  })
  
  await test.step('when hakemus has been handled', async () => {
    await hakemustenArviointiPage.navigateToLatestHakemusArviointi(avustushakuID)
    await hakemustenArviointiPage.acceptHakemus()

    await hakemustenArviointiPage.navigateToLatestHakemusArviointi(avustushakuID)
    const hakemusPage = await hakemustenArviointiPage.openHakemusEditPage()

    assertTokens(hakemusPage.page)
    await hakemusPage.selectMaakuntaFromDropdown('Etelä-Karjala')
    await hakemusPage.submitOfficerEdit()

    await hakemustenArviointiPage.page.bringToFront()
    await hakemustenArviointiPage.navigateToLatestHakemusArviointi(avustushakuID)
    await waitForElementWithText(page, 'span', 'Etelä-Karjala')
  })
})
