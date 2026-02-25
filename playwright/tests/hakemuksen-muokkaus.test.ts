import { expect, Page } from '@playwright/test'
import { URLSearchParams } from 'url'

import { muutoshakemusTest as test } from '../fixtures/muutoshakemusTest'
import { HakemustenArviointiPage } from '../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { HakijaAvustusHakuPage } from '../pages/hakija/hakijaAvustusHakuPage'

test('virkailija can edit hakemus', async ({ page, avustushakuID, submittedHakemus: hakemus }) => {
  const hakemustenArviointiPage = new HakemustenArviointiPage(page)
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
    await expect(hakemustenArviointiPage.sidebarLocators().oldAnswers.koodisto).toHaveText('Kainuu')
    await expect(hakemustenArviointiPage.sidebarLocators().newAnswers.koodisto).toHaveText(
      'Itä-Uusimaa'
    )
  })

  await test.step('when the avustushaku has been closed', async () => {
    const haunTiedotPage = await hakemustenArviointiPage.header.switchToHakujenHallinta()
    await haunTiedotPage.closeAvustushakuByChangingEndDateToPast()

    await hakemustenArviointiPage.navigateToLatestHakemusArviointi(avustushakuID)
    const hakemusPage = await hakemustenArviointiPage.openHakemusEditPage()

    assertTokens(hakemusPage.page)
    await hakemusPage.selectMaakuntaFromDropdown('Etelä-Savo')
    await hakemusPage.submitOfficerEdit()

    await hakemustenArviointiPage.page.bringToFront()
    await hakemustenArviointiPage.navigateToLatestHakemusArviointi(avustushakuID)
    await expect(hakemustenArviointiPage.sidebarLocators().oldAnswers.koodisto).toHaveText('Kainuu')
    await expect(hakemustenArviointiPage.sidebarLocators().newAnswers.koodisto).toHaveText(
      'Etelä-Savo'
    )
  })

  await test.step('when hakemus has been handled', async () => {
    await hakemustenArviointiPage.navigateToLatestHakemusArviointi(avustushakuID)
    await hakemustenArviointiPage.acceptHakemus()
    await hakemustenArviointiPage.waitForSave()
    await hakemustenArviointiPage.navigateToLatestHakemusArviointi(avustushakuID)
    const hakemusPage = await hakemustenArviointiPage.openHakemusEditPage()

    assertTokens(hakemusPage.page)
    await hakemusPage.selectMaakuntaFromDropdown('Etelä-Karjala')
    await hakemusPage.submitOfficerEdit()

    await hakemustenArviointiPage.page.bringToFront()
    await hakemustenArviointiPage.navigateToLatestHakemusArviointi(avustushakuID)
    await expect(hakemustenArviointiPage.sidebarLocators().oldAnswers.koodisto).toHaveText('Kainuu')
    await expect(hakemustenArviointiPage.sidebarLocators().newAnswers.koodisto).toHaveText(
      'Etelä-Karjala'
    )
  })
})

test('hakija', async ({ page, avustushakuID, submittedHakemus: hakemus }) => {
  const hakemusPage = HakijaAvustusHakuPage(page)
  const hakemustenArviointiPage = new HakemustenArviointiPage(page)

  await test.step('can edit hakemus when hakemus has been submitted', async () => {
    await hakemusPage.navigateToExistingHakemusPage(avustushakuID, hakemus.userKey)
    await hakemusPage.selectMaakuntaFromDropdown('Etelä-Savo')
    await hakemusPage.waitForEditSaved()

    await hakemustenArviointiPage.navigateToLatestHakemusArviointi(avustushakuID)
    await expect(hakemustenArviointiPage.sidebarLocators().koodisto).toHaveText('Etelä-Savo')
  })

  await test.step('can edit hakemus when a change request has been made', async () => {
    const haunTiedotPage = await hakemustenArviointiPage.header.switchToHakujenHallinta()
    await haunTiedotPage.closeAvustushakuByChangingEndDateToPast()

    await hakemustenArviointiPage.navigateToLatestHakemusArviointi(avustushakuID)
    await hakemustenArviointiPage.createChangeRequest()

    await hakemusPage.navigateToExistingHakemusPage(avustushakuID, hakemus.userKey)
    await hakemusPage.selectMaakuntaFromDropdown('Ahvenanmaa')
    await hakemusPage.submitChangeRequestResponse()

    await hakemustenArviointiPage.navigateToLatestHakemusArviointi(avustushakuID)
    await expect(hakemustenArviointiPage.sidebarLocators().oldAnswers.koodisto).toHaveText(
      'Etelä-Savo'
    )
    await expect(hakemustenArviointiPage.sidebarLocators().newAnswers.koodisto).toHaveText(
      'Ahvenanmaa'
    )
  })

  await test.step('can not edit hakemus when a change request has been cancelled', async () => {
    await hakemustenArviointiPage.navigateToLatestHakemusArviointi(avustushakuID)
    await hakemustenArviointiPage.createChangeRequest('it never happened')
    await expect(hakemustenArviointiPage.page.locator('div.change-request-title')).toBeVisible()

    await hakemustenArviointiPage.cancelChangeRequest()

    await hakemusPage.navigateToExistingHakemusPage(avustushakuID, hakemus.userKey)
    await hakemusPage.waitForPreview()
  })

  await test.step('can not edit hakemus when officer is editing it', async () => {
    await hakemustenArviointiPage.navigateToLatestHakemusArviointi(avustushakuID)
    const officerEditPage = await hakemustenArviointiPage.openHakemusEditPage()
    await expect(officerEditPage.officerEditSubmitButton).toBeEnabled()

    await hakemusPage.navigateToExistingHakemusPage(avustushakuID, hakemus.userKey)
    await hakemusPage.waitForPreview()
    await expect(hakemusPage.officerEditSubmitButton).toBeHidden()
  })
})
