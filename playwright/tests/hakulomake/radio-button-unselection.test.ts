import { defaultValues } from '../../fixtures/defaultValues'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { expect } from '@playwright/test'
import { expectToBeDefined } from '../../utils/util'

defaultValues(
  'user can unselect a radio button by clicking it again',
  async ({ page, hakuProps, answers, userCache }) => {
    expectToBeDefined(userCache)

    // Create and publish a standard haku
    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const haunTiedotPage = await hakujenHallintaPage.navigate(1)
    const avustushakuID = await hakujenHallintaPage.createMuutoshakemusEnabledHaku(hakuProps)
    await haunTiedotPage.publishAvustushaku()

    // Navigate to hakija form
    const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
    await hakijaAvustusHakuPage.navigate(avustushakuID, 'fi')
    const hakemusUrl = await hakijaAvustusHakuPage.startApplication(
      avustushakuID,
      answers.contactPersonEmail
    )
    await page.goto(hakemusUrl)

    // Test radio button unselection on "Omistajatyyppi" (radioButton-0)
    const radioOption1Label = page.locator('label[for="radioButton-0.radio.0"]')
    const radioInput1 = page.locator('#radioButton-0\\.radio\\.0')

    // Initially no option should be selected
    await expect(radioInput1).not.toBeChecked()

    // Click to select option 1 (Kunta/kuntayhtymä)
    await radioOption1Label.click()
    await expect(radioInput1).toBeChecked()

    // Click the same option again to unselect
    await radioOption1Label.click()
    await expect(radioInput1).not.toBeChecked()

    // Select option 2 (Liiketaloudellisin perustein)
    const radioOption2Label = page.locator('label[for="radioButton-0.radio.1"]')
    const radioInput2 = page.locator('#radioButton-0\\.radio\\.1')
    await radioOption2Label.click()
    await expect(radioInput2).toBeChecked()
    await expect(radioInput1).not.toBeChecked()

    // Click option 2 again to unselect
    await radioOption2Label.click()
    await expect(radioInput2).not.toBeChecked()
    await expect(radioInput1).not.toBeChecked()
  }
)
