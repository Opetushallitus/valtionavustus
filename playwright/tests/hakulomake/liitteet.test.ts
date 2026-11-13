import path from 'node:path'
import fs from 'node:fs/promises'
import { defaultValues } from '../../fixtures/defaultValues'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { expect, Page } from '@playwright/test'
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

const FIXTURE_ATTACHMENT_NAMES = [
  'previous-income-statement-and-balance-sheet',
  'previous-financial-year-report',
  'previous-financial-year-auditor-report',
  'current-year-plan-for-action-and-budget',
  'description-of-functional-development-during-last-five-years',
]

async function waitForFixtureAttachmentUploads(page: Page) {
  for (const name of FIXTURE_ATTACHMENT_NAMES) {
    await expect(page.locator(`[name='${name}']`)).toHaveCount(0)
  }
  await expect(page.locator('#pending-changes')).toHaveText('false')
}

test('hakemus requires all attachments to be uploaded before it can be sent', async ({
  hakijaAvustusHakuPage,
}) => {
  const { page } = hakijaAvustusHakuPage
  const finaLocator = page.locator("[name='financial-information-form']")
  await test.step('uploading the last attachment', async () => {
    await finaLocator.waitFor({ state: 'attached' })
    await finaLocator.setInputFiles(dummyPdfPath)
    await finaLocator.waitFor({ state: 'detached' })
  })
  await test.step('can remove attachment', async () => {
    await page.locator('#financial-information-form').locator('button.soresu-remove').click()
    await finaLocator.waitFor({ state: 'attached' })
  })
  await test.step('removal disables sending and lists the attachment as missing', async () => {
    await expect(page.locator('#pending-changes')).toHaveText('false')
    await expect(hakijaAvustusHakuPage.sendHakemusButton).toBeDisabled()
    await page.locator('#form-error-summary .validation-errors-summary').click()
    await expect(
      page.locator('#form-error-summary').getByTestId('financial-information-form')
    ).toHaveText('Taloustietolomake: Pakollinen tieto')
  })
  await test.step('adding last attachment back allows sending', async () => {
    await finaLocator.setInputFiles(dummyPdfPath)
    await finaLocator.waitFor({ state: 'detached' })
    await hakijaAvustusHakuPage.submitApplication()
  })
})

function heldUntilReleased() {
  let release = () => {}
  const released = new Promise<void>((resolve) => {
    release = resolve
  })
  return { release, released }
}

test('sending waits until an attachment upload and the following hakemus refresh have finished', async ({
  hakijaAvustusHakuPage,
}) => {
  const { page } = hakijaAvustusHakuPage
  await waitForFixtureAttachmentUploads(page)
  const upload = heldUntilReleased()
  const refresh = heldUntilReleased()
  await page.route('**/attachments/financial-information-form', async (route) => {
    if (route.request().method() === 'PUT') {
      await upload.released
    }
    await route.continue()
  })
  await page.route(
    (url) => /^\/api\/avustushaku\/\d+\/hakemus\/[^/]+$/.test(url.pathname),
    async (route) => {
      if (route.request().method() === 'GET') {
        await refresh.released
      }
      await route.continue()
    }
  )

  await page.locator("[name='financial-information-form']").setInputFiles(dummyPdfPath)
  await expect(hakijaAvustusHakuPage.sendHakemusButton).toBeDisabled()

  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().endsWith('/attachments/financial-information-form') &&
        response.request().method() === 'PUT'
    ),
    upload.release(),
  ])
  await expect(page.locator("[name='financial-information-form']")).toHaveCount(0)
  await expect(hakijaAvustusHakuPage.sendHakemusButton).toBeDisabled()

  refresh.release()
  await hakijaAvustusHakuPage.submitApplication()
})
