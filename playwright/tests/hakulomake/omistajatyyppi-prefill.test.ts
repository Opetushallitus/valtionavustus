import path from 'node:path'
import fs from 'node:fs/promises'

import { expect, Page } from '@playwright/test'
import { defaultValues } from '../../fixtures/defaultValues'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'
import { Answers } from '../../utils/types'
import { randomString } from '../../utils/random'

const AKAAN_KAUPUNKI_BUSINESS_ID = '2050864-5'

const test = defaultValues.extend<{
  avustushakuID: number
}>({
  avustushakuID: async ({ page, hakuProps, userCache }, use) => {
    expect(userCache).toBeDefined()
    const hakujenHallintaPage = new HakujenHallintaPage(page)

    const lomakeJson = await fs.readFile(
      path.join(__dirname, '../../fixtures/avustushaku-with-omistajatyyppi.json'),
      'utf8'
    )

    const { avustushakuID } = await hakujenHallintaPage.createHakuWithLomakeJson(
      lomakeJson,
      hakuProps
    )
    await hakujenHallintaPage.commonHakujenHallinta.switchToHaunTiedotTab()
    await hakujenHallintaPage.fillAvustushaku(hakuProps)
    const haunTiedotPage = await hakujenHallintaPage.commonHakujenHallinta.switchToHaunTiedotTab()
    await haunTiedotPage.publishAvustushaku()
    await use(avustushakuID)
  },
})

async function enterBusinessIdAndFetch(page: Page, businessId: string) {
  await page.fill('#finnish-business-id', businessId)

  await Promise.all([
    page.waitForResponse((resp) => resp.url().includes('/api/organisation-type/'), {
      timeout: 10000,
    }),
    page.waitForResponse(
      (resp) => resp.url().includes('/api/organisations/') && resp.status() === 200,
      { timeout: 10000 }
    ),
    page.click('input.get-business-id'),
  ])

  await expect(page.locator('[data-test-id="organisation-selection-fi"]')).toBeVisible()
}

async function selectOrganisationAndConfirm(page: Page) {
  await page.click('[data-test-id="organisation-selection-fi"]')
  await page.click('[data-test-id="confirm-selection"]')
}

// Each hakemus needs its own email, startApplication picks the first email sent to the address
async function startNewHakemus(page: Page, avustushakuID: number, answers: Answers) {
  const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
  await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang)
  const hakemusUrl = await hakijaAvustusHakuPage.startApplication(
    avustushakuID,
    `${randomString()}-${answers.contactPersonEmail}`
  )
  await page.goto(hakemusUrl)
}

test('omistajatyyppi prefill from organisation data', async ({ page, avustushakuID, answers }) => {
  await test.step('omistajatyyppi is locked to kunta_kirkko for a municipality, also after reload', async () => {
    await test.step('start new hakemus', async () => {
      await startNewHakemus(page, avustushakuID, answers)
    })
    await test.step('fetch organisation data for Akaan kaupunki', async () => {
      await enterBusinessIdAndFetch(page, AKAAN_KAUPUNKI_BUSINESS_ID)
    })
    await test.step('select organization and confirm', async () => {
      await selectOrganisationAndConfirm(page)
    })
    await test.step('omistajatyyppi is auto-selected as kunta_kirkko and disabled', async () => {
      await expect(page.locator('input[type="radio"][value="kunta_kirkko"]')).toBeChecked()
      await expect(page.locator('input[type="radio"][value="kunta_kirkko"]')).toBeDisabled()
    })
    await test.step('after page reload omistajatyyppi cannot be changed', async () => {
      await page.reload()
      await expect(page.locator('label[for="radioButton-0.radio.0"]')).toBeVisible()
      await page.locator('label[for="radioButton-0.radio.1"]').click({ force: true })
      await expect(page.locator('input[type="radio"][value="liiketalous"]')).not.toBeChecked()
      await expect(page.locator('input[type="radio"][value="kunta_kirkko"]')).toBeChecked()
    })
  })

  await test.step('omistajatyyppi is locked to valtio for a state agency', async () => {
    await test.step('start new hakemus', async () => {
      await startNewHakemus(page, avustushakuID, answers)
    })
    await test.step('fetch organisation data for a state agency', async () => {
      await enterBusinessIdAndFetch(page, '0211675-2')
    })
    await test.step('select organization and confirm', async () => {
      await selectOrganisationAndConfirm(page)
    })
    await test.step('omistajatyyppi is auto-selected as valtio and disabled', async () => {
      await expect(page.locator('input[type="radio"][value="valtio"]')).toBeChecked()
      await expect(page.locator('input[type="radio"][value="valtio"]')).toBeDisabled()
    })
  })

  await test.step('omistajatyyppi is not prefilled and can be chosen when organisation type is not found', async () => {
    await test.step('start new hakemus', async () => {
      await startNewHakemus(page, avustushakuID, answers)
    })
    await test.step('fetch organisation data for Y-tunnus without organisation type', async () => {
      await enterBusinessIdAndFetch(page, '0187690-1')
    })
    await test.step('select organization and confirm', async () => {
      await selectOrganisationAndConfirm(page)
    })
    await test.step('no omistajatyyppi radio button is pre-selected', async () => {
      await expect(page.locator('input[name="radioButton-0"]:checked')).toHaveCount(0)
    })
    await test.step('hakija can select omistajatyyppi manually', async () => {
      // Radio inputs are visually hidden; click the label instead
      await page.locator('label[for="radioButton-0.radio.2"]').click()
      await expect(page.locator('#radioButton-0\\.radio\\.2')).toBeChecked()
    })
  })
})
