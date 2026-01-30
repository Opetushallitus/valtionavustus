import { expect, test } from '@playwright/test'
import { defaultValues } from '../../../fixtures/defaultValues'
import { HakujenHallintaPage } from '../../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { HakemustenArviointiPage } from '../../../pages/virkailija/hakemusten-arviointi/hakemustenArviointiPage'
import { HakijaAvustusHakuPage } from '../../../pages/hakija/hakijaAvustusHakuPage'
import { Answers } from '../../../utils/types'
import muutoshakemusEnabledHakuLomakeJson from '../../../fixtures/prod.hakulomake.json'

const APPLICATION_COUNT = 15

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
      await page.goto(
        `http://localhost:8081/avustushaku/${avustushakuID}/?splitView=true`
      )
      await expect(page.locator('#hakemus-listing')).toBeVisible()
      await hakemustenArviointiPage.selectHakemusFromList('Test Project 00')
      await expect(page.locator('.split-view')).toBeVisible()
    })

    await test.step('Wait for split view to have scrollable list', async () => {
      const hakemusListing = page.locator('#hakemus-listing')
      await expect(hakemusListing).toHaveCSS('overflow-y', 'scroll', { timeout: 5000 })
    })

    const hakemusListingLocator = page.locator('#hakemus-listing')

    await test.step('Scroll to bottom of hakemus list', async () => {
      await hakemusListingLocator.evaluate((el) => {
        el.scrollTop = el.scrollHeight
      })
      await page.waitForTimeout(300)
    })

    const lastHakemusRow = hakemusListingLocator.locator('tbody tr').last()

    await test.step('Click add valmistelija button on last hakemus in scrolled list', async () => {
      const addValmistelijaButton = lastHakemusRow.locator(
        '[aria-label="Lisää valmistelija hakemukselle"]'
      )
      await expect(addValmistelijaButton).toBeVisible()
      await addValmistelijaButton.click()
    })

    await test.step('Verify ukotus modal is visible in viewport and usable', async () => {
      const ukotusModal = page.getByTestId('ukotusModal')

      await expect(ukotusModal).toBeVisible({ timeout: 5000 })

      const positionInfo = await page.evaluate(() => {
        const modal = document.querySelector('[data-test-id="ukotusModal"]')!
        const modalRect = modal.getBoundingClientRect()

        return {
          modal: {
            top: modalRect.top,
            bottom: modalRect.bottom,
            height: modalRect.height,
          },
          isModalVisibleInViewport:
            modalRect.top >= 0 &&
            modalRect.bottom <= window.innerHeight &&
            modalRect.left >= 0 &&
            modalRect.right <= window.innerWidth,
          windowHeight: window.innerHeight,
          windowWidth: window.innerWidth,
        }
      })

      console.log('Position info:', JSON.stringify(positionInfo, null, 2))

      expect(
        positionInfo.isModalVisibleInViewport,
        `Modal should be fully visible in viewport.\n` +
          `Modal: top=${positionInfo.modal.top}, bottom=${positionInfo.modal.bottom}, height=${positionInfo.modal.height}\n` +
          `Viewport: height=${positionInfo.windowHeight}, width=${positionInfo.windowWidth}`
      ).toBe(true)

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
