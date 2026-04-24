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

async function stubOwnerTypeApi(
  page: import('@playwright/test').Page,
  response: { status: number; body: string; contentType?: string },
  delay?: number
) {
  await page.route('**/api/organisation-type/**', async (route) => {
    if (delay) {
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
    route.fulfill({
      status: response.status,
      body: response.body,
      contentType: response.contentType ?? 'application/json',
    })
  })
}

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

  await test.step('stub owner-type API to return kunta_kirkko', async () => {
    await stubOwnerTypeApi(page, {
      status: 200,
      body: JSON.stringify({ 'owner-type': 'kunta_kirkko' }),
    })
  })

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

  await test.step('stub owner-type API to return valtio', async () => {
    await stubOwnerTypeApi(page, {
      status: 200,
      body: JSON.stringify({ 'owner-type': 'valtio' }),
    })
  })

  await test.step('enter Y-tunnus and fetch organization data', async () => {
    await enterBusinessIdAndFetch(page, AKAAN_KAUPUNKI_BUSINESS_ID)
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

  await test.step('stub owner-type API to return 404', async () => {
    await stubOwnerTypeApi(page, { status: 404, body: '' })
  })

  await test.step('enter Y-tunnus and fetch organization data', async () => {
    await enterBusinessIdAndFetch(page, AKAAN_KAUPUNKI_BUSINESS_ID)
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

test('late owner-type response from earlier search does not leak into later selection', async ({
  hakijaAvustusHakuPage,
}) => {
  const { page } = hakijaAvustusHakuPage

  let requestCount = 0
  await test.step('stub owner-type API: first call slow with valtio, second call fast 404', async () => {
    await page.route('**/api/organisation-type/**', async (route) => {
      requestCount++
      if (requestCount === 1) {
        // First request: slow response returning valtio
        await new Promise((resolve) => setTimeout(resolve, 3000))
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ 'owner-type': 'valtio' }),
          contentType: 'application/json',
        })
      } else {
        // Second request: fast 404
        await route.fulfill({ status: 404, body: '' })
      }
    })
  })

  await test.step('first search: enter Y-tunnus (slow response pending)', async () => {
    await page.fill('#finnish-business-id', AKAAN_KAUPUNKI_BUSINESS_ID)

    // Only wait for org lookup, not the slow owner-type response
    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/api/organisations/') && resp.status() === 200,
        { timeout: 10000 }
      ),
      page.click('input.get-business-id'),
    ])

    await expect(page.locator('[data-test-id="organisation-selection-fi"]')).toBeVisible()
  })

  await test.step('second search: immediately search again (triggers fast 404)', async () => {
    // Clear and re-enter the same Y-tunnus to trigger a second search
    await page.fill('#finnish-business-id', '')
    await page.fill('#finnish-business-id', AKAAN_KAUPUNKI_BUSINESS_ID)

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
  })

  await test.step('select organization and confirm', async () => {
    await selectOrganisationAndConfirm(page)
  })

  await test.step('verify no omistajatyyppi is pre-selected (late first response ignored)', async () => {
    await expect(page.locator('input[name="radioButton-0"]:checked')).toHaveCount(0)
  })
})

test('confirm button is disabled while owner-type lookup is loading', async ({
  hakijaAvustusHakuPage,
}) => {
  const { page } = hakijaAvustusHakuPage

  await test.step('stub owner-type API with long delay', async () => {
    await stubOwnerTypeApi(
      page,
      { status: 200, body: JSON.stringify({ 'owner-type': 'kunta_kirkko' }) },
      2000
    )
  })

  await test.step('enter Y-tunnus and fetch organization data', async () => {
    await page.fill('#finnish-business-id', AKAAN_KAUPUNKI_BUSINESS_ID)

    // Only wait for org lookup, not the slow owner-type
    await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/api/organisations/') && resp.status() === 200,
        { timeout: 10000 }
      ),
      page.click('input.get-business-id'),
    ])

    await expect(page.locator('[data-test-id="organisation-selection-fi"]')).toBeVisible()
  })

  await test.step('select organisation — confirm button is disabled while lookup loads', async () => {
    await page.click('[data-test-id="organisation-selection-fi"]')
    await expect(page.locator('[data-test-id="confirm-selection"]')).toBeDisabled()
  })

  await test.step('wait for owner-type response — confirm button becomes enabled', async () => {
    await page.waitForResponse((resp) => resp.url().includes('/api/organisation-type/'), {
      timeout: 10000,
    })
    await expect(page.locator('[data-test-id="confirm-selection"]')).toBeEnabled()
  })

  await test.step('confirm and verify auto-fill applied', async () => {
    await page.click('[data-test-id="confirm-selection"]')
    await expect(page.locator('input[type="radio"][value="kunta_kirkko"]')).toBeChecked()
  })
})

test('omistajatyyppi remains locked after page reload', async ({ hakijaAvustusHakuPage }) => {
  const { page } = hakijaAvustusHakuPage

  await test.step('stub owner-type API to return kunta_kirkko', async () => {
    await stubOwnerTypeApi(page, {
      status: 200,
      body: JSON.stringify({ 'owner-type': 'kunta_kirkko' }),
    })
  })

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
