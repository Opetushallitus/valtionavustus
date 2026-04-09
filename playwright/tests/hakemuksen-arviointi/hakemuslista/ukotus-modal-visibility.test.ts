import { expect, test } from '@playwright/test'
import { defaultValues } from '../../../fixtures/defaultValues'
import { HakujenHallintaPage } from '../../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { HakemustenArviointiPage } from '../../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { HakijaAvustusHakuPage } from '../../../pages/hakija/hakijaAvustusHakuPage'
import { Answers } from '../../../utils/types'
import muutoshakemusEnabledHakuLomakeJson from '../../../fixtures/prod.hakulomake.json'

const APPLICATION_COUNT = 25

const manyApplicationsTest = defaultValues.extend<{
  avustushakuID: number
  submittedHakemukset: { projectName: string }[]
}>({
  avustushakuID: async ({ page, hakuProps, userCache }, use, testInfo) => {
    expect(userCache).toBeDefined()
    testInfo.setTimeout(testInfo.timeout + 120_000)

    const hakujenHallintaPage = new HakujenHallintaPage(page)
    const avustushakuID = await hakujenHallintaPage.createPublishedAvustushaku(
      hakuProps,
      JSON.stringify(muutoshakemusEnabledHakuLomakeJson)
    )
    await use(avustushakuID)
  },
  submittedHakemukset: async ({ avustushakuID, answers, page }, use, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 180_000)

    const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
    const submittedHakemukset: { projectName: string }[] = []

    for (let i = 0; i < APPLICATION_COUNT; i++) {
      const projectName = `Test Project ${i.toString().padStart(2, '0')}`
      const testAnswers: Answers = {
        ...answers,
        organization: `Test Organization ${i}`,
        projectName,
        contactPersonEmail: `test${i}@example.com`,
      }
      await test.step(`Submit hakemus ${i + 1}/${APPLICATION_COUNT}`, async () => {
        await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang)
        await hakijaAvustusHakuPage.fillAndSendMuutoshakemusEnabledHakemus(
          avustushakuID,
          testAnswers
        )
        submittedHakemukset.push({ projectName })
      })
    }

    await use(submittedHakemukset)
  },
})

test.setTimeout(300000)

manyApplicationsTest(
  'Ukotus modal is visible when there are many applications and list is scrolled in split view',
  async ({ page, avustushakuID, submittedHakemukset }) => {
    expect(submittedHakemukset.length).toBe(APPLICATION_COUNT)

    const hakemustenArviointiPage = new HakemustenArviointiPage(page)

    await test.step('Navigate to hakemusten arviointi in split view with first hakemus selected', async () => {
      await hakemustenArviointiPage.navigate(avustushakuID, { splitView: true })
      await expect(page.locator('#hakemus-listing')).toBeVisible()
      await hakemustenArviointiPage.selectHakemusFromList('Test Project 00')
      await expect(page.locator('.split-view')).toBeVisible()
    })

    await test.step('Close hakemus details so the full list is visible', async () => {
      await hakemustenArviointiPage.closeHakemusDetails()
      await expect(page.locator('#hakemus-details')).toBeHidden()
    })

    const hakemusListingLocator = page.locator('#hakemus-listing')
    const lastHakemusRow = hakemusListingLocator.locator('tbody tr').last()

    await test.step('Scroll to bottom of hakemus list', async () => {
      await lastHakemusRow.scrollIntoViewIfNeeded()
    })

    await expect(lastHakemusRow).toBeInViewport()

    await test.step('Click add valmistelija button on last hakemus in scrolled list', async () => {
      const addValmistelijaButton = lastHakemusRow.locator(
        '[aria-label="Lisää valmistelija hakemukselle"]'
      )
      await expect(addValmistelijaButton).toBeVisible()
      await addValmistelijaButton.click()
    })

    await test.step('Verify ukotus modal is visible in viewport and usable', async () => {
      const ukotusModal = page.getByTestId('ukotusModal')

      await expect(ukotusModal).toBeInViewport({ ratio: 1, timeout: 5000 })

      const valmistelijaButton = ukotusModal.locator(
        '[aria-label="Lisää _ valtionavustus valmistelijaksi"]'
      )
      await expect(valmistelijaButton).toBeVisible()

      await valmistelijaButton.click()

      await expect(
        page.locator('[aria-label="Poista _ valtionavustus valmistelijan roolista"]')
      ).toBeVisible()
    })

    await test.step('Close the modal', async () => {
      await hakemustenArviointiPage.closeUkotusModal()
    })
  }
)
