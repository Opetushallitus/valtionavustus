import { APIRequestContext, expect } from '@playwright/test'
import { selvitysTest } from '../../../fixtures/selvitysTest'
import { LoppuselvitysPage } from '../../../pages/virkailija/hakujen-hallinta/LoppuselvitysPage'
import { getSelvitysEmailsWithLoppuselvitysSubject } from '../../../utils/emails'
import { VIRKAILIJA_URL } from '../../../utils/constants'

const test = selvitysTest.extend({
  enableOtantatarkastus: true,
})

async function setOtantapolku(
  request: APIRequestContext,
  hakemusID: number,
  otantapolku: 'satunnaisotanta' | 'otannan-ulkopuolella'
) {
  const response = await request.post(`${VIRKAILIJA_URL}/api/test/set-loppuselvitys-otantapolku`, {
    data: { 'hakemus-id': hakemusID, otantapolku: otantapolku },
  })
  expect(response.ok()).toBeTruthy()
}

test.describe.parallel('Otantatarkastus', () => {
  test('satunnaisotanta: shows banner and checklist, always sends to taloustarkastus', async ({
    page,
    request,
    avustushakuID,
    acceptedHakemus: { hakemusID },
    loppuselvitysSubmitted,
  }) => {
    expect(loppuselvitysSubmitted).toBeDefined()
    await setOtantapolku(request, hakemusID, 'satunnaisotanta')

    const loppuselvitysPage = LoppuselvitysPage(page)
    await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID)

    await expect(loppuselvitysPage.locators.otantatarkastus.checklist).toBeVisible()
    await expect(loppuselvitysPage.locators.otantatarkastus.satunnaisotantaBanner).toBeHidden()
    await expect(loppuselvitysPage.locators.otantatarkastus.approvalEmailForm).toBeHidden()
    await expect(loppuselvitysPage.locators.asiatarkastus.confirmAcceptance).toBeHidden()

    await loppuselvitysPage.checkAllChecklistItems()

    // banner appears only after all checklist items answered
    await expect(loppuselvitysPage.locators.otantatarkastus.satunnaisotantaBanner).toBeVisible()
    // approval email form must never appear for satunnaisotanta regardless of checklist answers
    await expect(loppuselvitysPage.locators.otantatarkastus.approvalEmailForm).toBeHidden()
    // comment is optional for satunnaisotanta: button is enabled without a message
    await expect(loppuselvitysPage.locators.asiatarkastus.confirmAcceptance).toBeEnabled()

    const [verifyResponse] = await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes('/loppuselvitys/verify-information') &&
          resp.request().method() === 'POST'
      ),
      loppuselvitysPage.locators.asiatarkastus.confirmAcceptance.click(),
    ])
    expect((await verifyResponse.json())['otantapolku']).toBe('satunnaisotanta')

    await expect(loppuselvitysPage.locators.asiatarkastettu).toBeVisible()
    await expect(loppuselvitysPage.locators.taloustarkastus.accept).toBeVisible()
  })

  test('satunnaisotanta + risk: comment is required when not all checklist items are checked', async ({
    page,
    request,
    avustushakuID,
    acceptedHakemus: { hakemusID },
    loppuselvitysSubmitted,
  }) => {
    expect(loppuselvitysSubmitted).toBeDefined()
    await setOtantapolku(request, hakemusID, 'satunnaisotanta')

    const loppuselvitysPage = LoppuselvitysPage(page)
    await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID)

    await expect(loppuselvitysPage.locators.otantatarkastus.checklist).toBeVisible()

    const checklist = loppuselvitysPage.locators.otantatarkastus.checklist
    const kyllaLabels = checklist.locator('label', { hasText: 'Kyllä' })
    await kyllaLabels.nth(0).click()
    await kyllaLabels.nth(1).click()
    await kyllaLabels.nth(2).click()
    const eiLabels = checklist.locator('label', { hasText: 'Ei' })
    await eiLabels.nth(3).click()

    await expect(loppuselvitysPage.locators.otantatarkastus.satunnaisotantaBanner).toBeVisible()
    // a risk was found, so the comment is required: button stays disabled without a message
    await expect(loppuselvitysPage.locators.asiatarkastus.confirmAcceptance).toBeDisabled()

    await loppuselvitysPage.locators.asiatarkastus.acceptMessage.fill('Satunnaisotanta - riski')
    await expect(loppuselvitysPage.locators.asiatarkastus.confirmAcceptance).toBeEnabled()

    const [verifyResponse] = await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes('/loppuselvitys/verify-information') &&
          resp.request().method() === 'POST'
      ),
      loppuselvitysPage.locators.asiatarkastus.confirmAcceptance.click(),
    ])
    expect((await verifyResponse.json())['otantapolku']).toBe('satunnaisotanta')

    await expect(loppuselvitysPage.locators.asiatarkastettu).toBeVisible()
    await expect(loppuselvitysPage.locators.taloustarkastus.accept).toBeVisible()
  })

  test('otannan-ulkopuolella + all checked: asiatarkasta and accept atomically and sends email', async ({
    page,
    request,
    avustushakuID,
    acceptedHakemus: { hakemusID },
    loppuselvitysSubmitted,
  }) => {
    expect(loppuselvitysSubmitted).toBeDefined()
    await setOtantapolku(request, hakemusID, 'otannan-ulkopuolella')

    const loppuselvitysPage = LoppuselvitysPage(page)
    await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID)

    await expect(loppuselvitysPage.locators.otantatarkastus.checklist).toBeVisible()
    await expect(loppuselvitysPage.locators.otantatarkastus.satunnaisotantaBanner).toBeHidden()
    await expect(loppuselvitysPage.locators.otantatarkastus.approvalEmailForm).toBeHidden()

    await loppuselvitysPage.checkAllChecklistItems()

    await expect(
      loppuselvitysPage.locators.otantatarkastus.otannanUlkopuolellaSuoraHyvaksyntaBanner
    ).toBeVisible()
    await expect(loppuselvitysPage.locators.otantatarkastus.approvalEmailForm).toBeVisible()
    await expect(loppuselvitysPage.locators.asiatarkastus.confirmAcceptance).toBeHidden()
    await expect(loppuselvitysPage.locators.asiatarkastus.acceptMessage).toBeVisible()
    // comment is optional here: approval button is enabled without a message
    await expect(loppuselvitysPage.locators.otantatarkastus.approvalConfirm).toBeEnabled()

    const [verifyResponse] = await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes('/loppuselvitys/verify-information') &&
          resp.request().method() === 'POST'
      ),
      loppuselvitysPage.locators.otantatarkastus.approvalConfirm.click(),
    ])
    expect((await verifyResponse.json())['otantapolku']).toBe('otannan-ulkopuolella')

    await expect(loppuselvitysPage.locators.asiatarkastettu).toBeVisible()
    await expect(loppuselvitysPage.locators.otantatarkastus.accepted).toBeVisible()
    await expect(loppuselvitysPage.locators.taloustarkastus.accept).toBeHidden()

    await expect
      .poll(
        async () => {
          const emails = await getSelvitysEmailsWithLoppuselvitysSubject(avustushakuID)
          return emails.length
        },
        { timeout: 10_000, intervals: [1_000] }
      )
      .toBeGreaterThanOrEqual(1)
  })

  test('otannan-ulkopuolella + risk: routes to taloustarkastus with riskiperusteinen flag', async ({
    page,
    request,
    avustushakuID,
    acceptedHakemus: { hakemusID },
    loppuselvitysSubmitted,
  }) => {
    expect(loppuselvitysSubmitted).toBeDefined()
    await setOtantapolku(request, hakemusID, 'otannan-ulkopuolella')

    const loppuselvitysPage = LoppuselvitysPage(page)
    await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID)

    await expect(loppuselvitysPage.locators.otantatarkastus.checklist).toBeVisible()

    const checklist = loppuselvitysPage.locators.otantatarkastus.checklist
    const kyllaLabels = checklist.locator('label', { hasText: 'Kyllä' })
    await kyllaLabels.nth(0).click()
    await kyllaLabels.nth(1).click()
    await kyllaLabels.nth(2).click()
    const eiLabels = checklist.locator('label', { hasText: 'Ei' })
    await eiLabels.nth(3).click()

    await expect(
      loppuselvitysPage.locators.otantatarkastus.otannanUlkopuolellaRiskiBanner
    ).toBeVisible()
    await expect(
      loppuselvitysPage.locators.otantatarkastus.otannanUlkopuolellaSuoraHyvaksyntaBanner
    ).toBeHidden()
    await expect(loppuselvitysPage.locators.otantatarkastus.approvalEmailForm).toBeHidden()
    await expect(loppuselvitysPage.locators.asiatarkastus.confirmAcceptance).toBeVisible()
    await expect(loppuselvitysPage.locators.asiatarkastus.confirmAcceptance).toBeDisabled()

    await loppuselvitysPage.locators.asiatarkastus.acceptMessage.fill('Riskiperusteinen huomio')

    const [verifyResponse] = await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes('/loppuselvitys/verify-information') &&
          resp.request().method() === 'POST'
      ),
      loppuselvitysPage.locators.asiatarkastus.confirmAcceptance.click(),
    ])
    expect((await verifyResponse.json())['otantapolku']).toBe('otannan-ulkopuolella')

    await expect(loppuselvitysPage.locators.asiatarkastettu).toBeVisible()
    await expect(loppuselvitysPage.locators.taloustarkastus.accept).toBeVisible()
  })

  test('otannan-ulkopuolella: hyväksymislomake näyttää varoituksen kun organisaation sähköpostia ei saada', async ({
    page,
    request,
    avustushakuID,
    acceptedHakemus: { hakemusID },
    loppuselvitysSubmitted,
  }) => {
    expect(loppuselvitysSubmitted).toBeDefined()
    await setOtantapolku(request, hakemusID, 'otannan-ulkopuolella')
    await page.route('**/organisation-email', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ email: null }),
      })
    )
    const loppuselvitysPage = LoppuselvitysPage(page)
    await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID)
    await loppuselvitysPage.checkAllChecklistItems()

    await expect(loppuselvitysPage.locators.otantatarkastus.approvalEmailForm).toBeVisible()
    await expect(page.getByTestId('asiatarkastus-hyvaksynta-recipients-warning')).toBeVisible()
  })
})
