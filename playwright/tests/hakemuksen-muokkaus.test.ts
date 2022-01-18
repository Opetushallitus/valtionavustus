import { expect, Page } from "@playwright/test"
import { URLSearchParams } from "url"

import {muutoshakemusTest as test} from "../fixtures/muutoshakemusTest"
import {HakemustenArviointiPage} from "../pages/hakemustenArviointiPage"
import { HakijaAvustusHakuPage } from "../pages/hakijaAvustusHakuPage"
import {HakujenHallintaPage} from "../pages/hakujenHallintaPage"
import { waitForElementWithText } from "../utils/util"

test('virkailija can edit hakemus', async ({page, avustushakuID, submittedHakemus: hakemus}) => {
  const hakemustenArviointiPage = new HakemustenArviointiPage(page)
  const hakujenHallintaPage = new HakujenHallintaPage(page)
  hakemus.userKey = hakemus.userKey // here to ensure we have a hakemus :-)

  const assertTokens = (assertedPage: Page) => {
    const tokens = new URLSearchParams(assertedPage.url())
    expect(!!tokens.get('officerToken')).toBeTruthy()
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

test(`hakija can't edit hakemus when officer is editing it`, async ({browser, page, avustushakuID, submittedHakemus}) => {
  const hakujenHallintaPage = new HakujenHallintaPage(page)
  await hakujenHallintaPage.navigate(avustushakuID)
  await hakujenHallintaPage.setEndDate('1.1.2000 16.00')

  const hakemustenArviointiPage = new HakemustenArviointiPage(page)
  await hakemustenArviointiPage.navigateToLatestHakemusArviointi(avustushakuID)
  const officerEditPage = await hakemustenArviointiPage.openHakemusEditPage()
  await expect(officerEditPage.officerEditSubmitButton).toBeEnabled()

  await test.step(`hakija sees preview when there is no officer token`, async () => {
    const newPage = await browser.newPage()
    const hakemusPage = new HakijaAvustusHakuPage(newPage)
    await hakemusPage.navigateToExistingHakemusPage(avustushakuID, submittedHakemus.userKey)
    await hakemusPage.waitForPreview()
    await expect(hakemusPage.officerEditSubmitButton).toBeHidden()
  })
})

test('hakija can edit hakemus', async ({page, avustushakuID, submittedHakemus: hakemus}) => {
  const hakemusPage = new HakijaAvustusHakuPage(page)
  const hakemustenArviointiPage = new HakemustenArviointiPage(page)
  const hakujenHallintaPage = new HakujenHallintaPage(page)

  await test.step('when hakemus has been submitted', async () => {
    await hakemusPage.navigateToExistingHakemusPage(avustushakuID, hakemus.userKey)
    await hakemusPage.selectMaakuntaFromDropdown('Etelä-Savo')
    await hakemusPage.waitForEditSaved()

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
