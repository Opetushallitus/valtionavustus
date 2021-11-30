import {expect} from "@playwright/test"
import { Page } from "playwright"
import { URLSearchParams } from "url"

import {hakemusTest as test} from "../fixtures/hakemusTest"
import {HakemustenArviointiPage} from "../pages/hakemustenArviointiPage"
import { HakijaAvustusHakuPage } from "../pages/hakijaAvustusHakuPage"
import {HakujenHallintaPage} from "../pages/hakujenHallintaPage"
import { waitForElementWithText } from "../utils/util"

test.setTimeout(180000)

test('virkailija can edit hakemus', async ({page, avustushakuID, hakemus}) => {
  const hakemustenArviointiPage = new HakemustenArviointiPage(page)
  const hakujenHallintaPage = new HakujenHallintaPage(page)
  hakemus.userKey = hakemus.userKey // here to ensure we have a hakemus :)

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

test('hakija can edit hakemus', async ({page, avustushakuID, hakemus}) => {
  const hakemusPage = new HakijaAvustusHakuPage(page)
  const hakemustenArviointiPage = new HakemustenArviointiPage(page)
  const hakujenHallintaPage = new HakujenHallintaPage(page)

  await test.step('when hakemus has been submitted', async () => {
    await hakemusPage.navigateToExistingHakemusPage(avustushakuID, hakemus.userKey)
    await hakemusPage.page.waitForResponse(/.*\/hakemus\/.*/) // wait for save
    await hakemusPage.selectMaakuntaFromDropdown('Etelä-Savo')

    await hakemustenArviointiPage.navigateToLatestHakemusArviointi(avustushakuID)
    await waitForElementWithText(page, 'span', 'Etelä-Savo')
  })

  await test.step('when a change request has been made', async () => {
    await hakujenHallintaPage.navigate(avustushakuID)
    await hakujenHallintaPage.closeAvustushakuByChangingEndDateToPast()

    await hakemustenArviointiPage.navigateToLatestHakemusArviointi(avustushakuID)
    await hakemustenArviointiPage.createChangeRequest()

    await hakemusPage.navigateToExistingHakemusPage(avustushakuID, hakemus.userKey)
    await hakemusPage.selectMaakuntaFromDropdown('Ahvenanmaa')
    await hakemusPage.submitChangeRequestResponse()

    await hakemustenArviointiPage.navigateToLatestHakemusArviointi(avustushakuID)
    await waitForElementWithText(page, 'span', 'Ahvenanmaa')
  })
})
