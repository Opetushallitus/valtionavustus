import { defaultValues } from '../../fixtures/defaultValues'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { expect } from '@playwright/test'
import { expectToBeDefined } from '../../utils/util'
import { TEST_Y_TUNNUS } from '../../utils/constants'

defaultValues(
  'user can unselect a radio button by clicking it again',
  async ({ page, hakuProps, answers, userCache }) => {
    expectToBeDefined(userCache)

    // Create and publish a standard haku
    // Note: createMuutoshakemusEnabledHaku already publishes the haku
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    await hakujenHallintaPage.navigate(1)
    const avustushakuID = await hakujenHallintaPage.createMuutoshakemusEnabledHaku(hakuProps)

    // Navigate to hakija form and fill in business ID to dismiss the modal
    const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
    await hakijaAvustusHakuPage.navigate(avustushakuID, 'fi')
    const hakemusUrl = await hakijaAvustusHakuPage.startApplication(
      avustushakuID,
      answers.contactPersonEmail
    )
    await page.goto(hakemusUrl)

    // Fill in business ID to dismiss the modal overlay
    await hakijaAvustusHakuPage.fillInBusinessId(TEST_Y_TUNNUS)

    // Test radio button unselection on "Omistajatyyppi" (radioButton-0)
    const radioOption1Label = page.locator('label[for="radioButton-0.radio.0"]')
    const radioInput1 = page.locator('#radioButton-0\\.radio\\.0')

    // Initially no option should be selected
    await expect(radioInput1).not.toBeChecked()

    // Click label to select option 1 (Kunta/kuntayhtymä)
    await radioOption1Label.click()
    await expect(radioInput1).toBeChecked()

    // Click label again to unselect (single click on already-selected option)
    await radioOption1Label.click()
    await expect(radioInput1).not.toBeChecked()

    // Select option 2 (Liiketaloudellisin perustein) via label
    const radioOption2Label = page.locator('label[for="radioButton-0.radio.1"]')
    const radioInput2 = page.locator('#radioButton-0\\.radio\\.1')
    await radioOption2Label.click()
    await expect(radioInput2).toBeChecked()
    await expect(radioInput1).not.toBeChecked()

    // Click label again to unselect option 2
    await radioOption2Label.click()
    await expect(radioInput2).not.toBeChecked()
    await expect(radioInput1).not.toBeChecked()
  }
)
