import { expect, APIRequestContext } from '@playwright/test'
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
  test('satunnaisotanta: shows banner, no checklist, sends to taloustarkastus', async ({
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

    await expect(loppuselvitysPage.locators.otantatarkastus.satunnaisotantaBanner).toBeVisible()
    await expect(loppuselvitysPage.locators.otantatarkastus.checklist).toBeHidden()
    await expect(loppuselvitysPage.locators.otantatarkastus.approvalEmailForm).toBeHidden()
    await expect(loppuselvitysPage.locators.asiatarkastus.confirmAcceptance).toBeVisible()
    await expect(loppuselvitysPage.locators.asiatarkastus.confirmAcceptance).toBeDisabled()

    await loppuselvitysPage.locators.asiatarkastus.acceptMessage.fill('Satunnaisotanta - kommentti')

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

  test('otannan-ulkopuolella + all checked: combo accepts atomically and sends email', async ({
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
    await loppuselvitysPage.locators.asiatarkastus.acceptMessage.fill('Kaikki kunnossa')

    await expect(loppuselvitysPage.locators.otantatarkastus.approvalEmailForm).toBeVisible()
    await expect(loppuselvitysPage.locators.asiatarkastus.confirmAcceptance).toBeHidden()

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

    const checkboxes =
      loppuselvitysPage.locators.otantatarkastus.checklist.locator('input[type="checkbox"]')
    await checkboxes.nth(0).check()
    await checkboxes.nth(1).check()
    await checkboxes.nth(2).check()

    await expect(
      loppuselvitysPage.locators.otantatarkastus.otannanUlkopuolellaRiskiBanner
    ).toBeVisible()
    await expect(loppuselvitysPage.locators.otantatarkastus.approvalEmailForm).toBeHidden()
    await expect(loppuselvitysPage.locators.asiatarkastus.confirmAcceptance).toBeVisible()

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
})

test.describe('2-vaiheinen regression', () => {
  selvitysTest(
    'no otantapolku → falls back to old 2-vaiheinen flow',
    async ({ page, avustushakuID, acceptedHakemus: { hakemusID }, loppuselvitysSubmitted }) => {
      expect(loppuselvitysSubmitted).toBeDefined()

      const loppuselvitysPage = LoppuselvitysPage(page)
      await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID)

      await expect(loppuselvitysPage.locators.otantatarkastus.checklist).toBeHidden()
      await expect(loppuselvitysPage.locators.otantatarkastus.satunnaisotantaBanner).toBeHidden()
      await expect(loppuselvitysPage.locators.asiatarkastus.confirmAcceptance).toBeVisible()

      await loppuselvitysPage.locators.asiatarkastus.acceptMessage.fill('2-vaiheinen kommentti')

      const [verifyResponse] = await Promise.all([
        page.waitForResponse(
          (resp) =>
            resp.url().includes('/loppuselvitys/verify-information') &&
            resp.request().method() === 'POST'
        ),
        loppuselvitysPage.locators.asiatarkastus.confirmAcceptance.click(),
      ])
      const body = await verifyResponse.json()
      expect(body['otantapolku']).toBeNull()

      await expect(loppuselvitysPage.locators.asiatarkastettu).toBeVisible()
      await expect(loppuselvitysPage.locators.taloustarkastus.accept).toBeVisible()
    }
  )
})
