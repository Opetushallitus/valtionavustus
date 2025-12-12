import path from 'node:path'
import fs from 'node:fs/promises'
import { defaultValues } from '../../fixtures/defaultValues'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { expect } from '@playwright/test'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { dummyPdfPath, TEST_Y_TUNNUS } from '../../utils/constants'

const test = defaultValues.extend<{
  hakijaAvustusHakuPage: ReturnType<typeof HakijaAvustusHakuPage>
}>({
  hakijaAvustusHakuPage: async ({ page, answers, hakuProps, userCache }, use) => {
    expect(userCache).toBeDefined()
    const hakujenHallintaPage = new HakujenHallintaPage(page)

    const esimerkkiHakuWithContactDetails = await fs.readFile(
      path.join(__dirname, '../../fixtures/avustushaku-with-contact-details.json'),
      'utf8'
    )

    const { avustushakuID } = await hakujenHallintaPage.createHakuWithLomakeJson(
      esimerkkiHakuWithContactDetails,
      hakuProps
    )

    const haunTiedotPage = await hakujenHallintaPage.commonHakujenHallinta.switchToHaunTiedotTab()
    await haunTiedotPage.publishAvustushaku()
    const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
    await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang)

    const hakemusUrl = await hakijaAvustusHakuPage.startApplication(
      avustushakuID,
      answers.contactPersonEmail
    )
    await hakijaAvustusHakuPage.page.goto(hakemusUrl)
    await hakijaAvustusHakuPage.fillApplication(answers, TEST_Y_TUNNUS)

    await hakijaAvustusHakuPage.page.fill('#applicant-name', answers.contactPersonName)
    await hakijaAvustusHakuPage.page.fill('#signature', answers.contactPersonName)
    await hakijaAvustusHakuPage.page.fill('#signature-email', answers.contactPersonEmail)
    await hakijaAvustusHakuPage.form.bank.iban.fill('FI95 6682 9530 0087 65')
    await hakijaAvustusHakuPage.form.bank.bic.fill('OKOYFIHH')
    await hakujenHallintaPage.page.click('text="Kansanopisto"')
    await hakujenHallintaPage.page.fill("[name='project-costs-row.amount']", '100000')
    await hakijaAvustusHakuPage.page
      .locator("[name='previous-income-statement-and-balance-sheet']")
      .setInputFiles(dummyPdfPath)
    await hakijaAvustusHakuPage.page
      .locator("[name='previous-financial-year-report']")
      .setInputFiles(dummyPdfPath)
    await hakijaAvustusHakuPage.page
      .locator("[name='previous-financial-year-auditor-report']")
      .setInputFiles(dummyPdfPath)
    await hakijaAvustusHakuPage.page
      .locator("[name='current-year-plan-for-action-and-budget']")
      .setInputFiles(dummyPdfPath)
    await hakijaAvustusHakuPage.page
      .locator("[name='description-of-functional-development-during-last-five-years']")
      .setInputFiles(dummyPdfPath)
    await use(hakijaAvustusHakuPage)
  },
})

test('hakemus requires all attachments to be uploaded before allowing to submit', async ({
  hakijaAvustusHakuPage,
}) => {
  const finaLocator = hakijaAvustusHakuPage.page.locator("[name='financial-information-form']")
  await test.step('enables sending after uploading last attachment', async () => {
    await hakijaAvustusHakuPage.sendHakemusButton.isDisabled()
    await finaLocator.waitFor({ state: 'attached' })
    await finaLocator.setInputFiles(dummyPdfPath)
    await finaLocator.waitFor({ state: 'detached' })
    await hakijaAvustusHakuPage.sendHakemusButton.isEnabled()
  })
  await test.step('can remove attachment', async () => {
    await hakijaAvustusHakuPage.page
      .locator('#financial-information-form')
      .locator('button.soresu-remove')
      .click()
    await finaLocator.waitFor({ state: 'attached' })
  })
  await test.step('removal disables sending', async () => {
    await hakijaAvustusHakuPage.sendHakemusButton.isDisabled()
  })
  await test.step('adding last attachment back allows sending', async () => {
    await finaLocator.setInputFiles(dummyPdfPath)
    await hakijaAvustusHakuPage.sendHakemusButton.isEnabled()
    await hakijaAvustusHakuPage.submitApplication()
  })
})
