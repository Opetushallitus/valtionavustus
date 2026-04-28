import path from 'node:path'
import fs from 'node:fs/promises'

import { expect } from '@playwright/test'
import { defaultValues } from '../../fixtures/defaultValues'
import { HakijaAvustusHakuPage } from '../../pages/hakija/hakijaAvustusHakuPage'
import { HakujenHallintaPage } from '../../pages/virkailija/hakujen-hallinta/hakujenHallintaPage'

const AKAAN_KAUPUNKI_BUSINESS_ID = '2050864-5'

const test = defaultValues.extend<{
  hakijaAvustusHakuPage: ReturnType<typeof HakijaAvustusHakuPage>
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
  hakijaAvustusHakuPage: async ({ page, answers, avustushakuID }, use) => {
    const hakijaAvustusHakuPage = HakijaAvustusHakuPage(page)
    await hakijaAvustusHakuPage.navigate(avustushakuID, answers.lang)

    const hakemusUrl = await hakijaAvustusHakuPage.startApplication(
      avustushakuID,
      answers.contactPersonEmail
    )
    await hakijaAvustusHakuPage.page.goto(hakemusUrl)
    await use(hakijaAvustusHakuPage)
  },
})

async function enterBusinessIdAndFetch(page: import('@playwright/test').Page, businessId: string) {
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

async function selectOrganisationAndConfirm(page: import('@playwright/test').Page) {
  await page.click('[data-test-id="organisation-selection-fi"]')
  await page.click('[data-test-id="confirm-selection"]')
}

test('omistajatyyppi is auto-filled as kunta_kirkko for a municipality', async ({
  hakijaAvustusHakuPage,
}) => {
  const { page } = hakijaAvustusHakuPage

  await test.step('enter Y-tunnus and fetch organization data', async () => {
    await enterBusinessIdAndFetch(page, AKAAN_KAUPUNKI_BUSINESS_ID)
  })

  await test.step('select organization and confirm', async () => {
    await selectOrganisationAndConfirm(page)
  })

  await test.step('verify omistajatyyppi radio button is auto-selected and disabled', async () => {
    await expect(page.locator('input[type="radio"][value="kunta_kirkko"]')).toBeChecked()
    await expect(page.locator('input[type="radio"][value="kunta_kirkko"]')).toBeDisabled()
  })
})

test('omistajatyyppi is auto-filled as valtio for a state agency', async ({
  hakijaAvustusHakuPage,
}) => {
  const { page } = hakijaAvustusHakuPage

  await test.step('enter Y-tunnus and fetch organization data', async () => {
    await enterBusinessIdAndFetch(page, '0211675-2')
  })

  await test.step('select organization and confirm', async () => {
    await selectOrganisationAndConfirm(page)
  })

  await test.step('verify omistajatyyppi radio button is auto-selected and disabled', async () => {
    await expect(page.locator('input[type="radio"][value="valtio"]')).toBeChecked()
    await expect(page.locator('input[type="radio"][value="valtio"]')).toBeDisabled()
  })
})

test('omistajatyyppi radio button is not pre-selected when API returns 404', async ({
  hakijaAvustusHakuPage,
}) => {
  const { page } = hakijaAvustusHakuPage

  await test.step('enter Y-tunnus and fetch organization data', async () => {
    await enterBusinessIdAndFetch(page, '0187690-1')
  })

  await test.step('select organization and confirm', async () => {
    await selectOrganisationAndConfirm(page)
  })

  await test.step('verify no omistajatyyppi radio button is pre-selected', async () => {
    await expect(page.locator('input[name="radioButton-0"]:checked')).toHaveCount(0)
  })

  await test.step('manually select omistajatyyppi', async () => {
    // Radio inputs are visually hidden; click the label instead
    await page.locator('label[for="radioButton-0.radio.2"]').click()
    await expect(page.locator('#radioButton-0\\.radio\\.2')).toBeChecked()
  })
})

test('omistajatyyppi remains locked after page reload', async ({ hakijaAvustusHakuPage }) => {
  const { page } = hakijaAvustusHakuPage

  await test.step('enter Y-tunnus and fetch organization data', async () => {
    await enterBusinessIdAndFetch(page, AKAAN_KAUPUNKI_BUSINESS_ID)
  })

  await test.step('select organization and confirm', async () => {
    await selectOrganisationAndConfirm(page)
  })

  await test.step('verify omistajatyyppi is auto-selected and disabled before reload', async () => {
    await expect(page.locator('input[type="radio"][value="kunta_kirkko"]')).toBeChecked()
    await expect(page.locator('input[type="radio"][value="kunta_kirkko"]')).toBeDisabled()
  })

  await test.step('reload the page', async () => {
    await page.reload()
    await expect(page.locator('label[for="radioButton-0.radio.0"]')).toBeVisible()
  })

  await test.step('clicking another omistajatyyppi must not change the selection', async () => {
    await page.locator('label[for="radioButton-0.radio.1"]').click({ force: true })
    await expect(page.locator('input[type="radio"][value="liiketalous"]')).not.toBeChecked()
    await expect(page.locator('input[type="radio"][value="kunta_kirkko"]')).toBeChecked()
  })
})
