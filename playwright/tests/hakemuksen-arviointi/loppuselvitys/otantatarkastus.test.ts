import { expect } from '@playwright/test'
import { selvitysTest } from '../../../fixtures/selvitysTest'
import { LoppuselvitysPage } from '../../../pages/virkailija/hakujen-hallinta/LoppuselvitysPage'
import { getSelvitysEmailsWithLoppuselvitysSubject } from '../../../utils/emails'

const test = selvitysTest.extend({
  enableOtantatarkastus: true,
})

test.describe.parallel('Otantatarkastus', () => {
  test('checklist visible and email preview appears when all items checked', async ({
    page,
    avustushakuID,
    acceptedHakemus: { hakemusID },
    loppuselvitysSubmitted,
  }) => {
    expect(loppuselvitysSubmitted).toBeDefined()

    const loppuselvitysPage = LoppuselvitysPage(page)
    await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID)

    await expect(loppuselvitysPage.locators.otantatarkastus.checklist).toBeVisible()
    await expect(loppuselvitysPage.locators.asiatarkastus.confirmAcceptance).toBeDisabled()
    await expect(loppuselvitysPage.locators.otantatarkastus.approvalEmailForm).toBeHidden()

    // Check all items — email form appears, simple submit button hidden
    await loppuselvitysPage.checkAllChecklistItems()

    await expect(loppuselvitysPage.locators.otantatarkastus.approvalEmailForm).toBeVisible()
    await expect(loppuselvitysPage.locators.otantatarkastus.approvalEmailSubject).toBeVisible()
    await expect(loppuselvitysPage.locators.otantatarkastus.approvalEmailContent).toBeVisible()
    await expect(loppuselvitysPage.locators.asiatarkastus.confirmAcceptance).toBeHidden()
  })

  test('riskiperusteinen: unchecked item routes to taloustarkastus', async ({
    page,
    avustushakuID,
    acceptedHakemus: { hakemusID },
    loppuselvitysSubmitted,
  }) => {
    expect(loppuselvitysSubmitted).toBeDefined()

    const loppuselvitysPage = LoppuselvitysPage(page)
    await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID)

    // Check only some items (leave at least one unchecked)
    const checkboxes = loppuselvitysPage.locators.otantatarkastus.checklist.locator(
      'input[type="checkbox"]'
    )
    await checkboxes.nth(0).check()
    await checkboxes.nth(1).check()

    await loppuselvitysPage.locators.asiatarkastus.acceptMessage.fill('Riskiperusteinen huomio')

    const [verifyResponse] = await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes('/loppuselvitys/verify-information') &&
          resp.request().method() === 'POST'
      ),
      loppuselvitysPage.locators.asiatarkastus.confirmAcceptance.click(),
    ])

    const responseBody = await verifyResponse.json()
    expect(responseBody['otanta-polku']).toBe('riskiperusteinen')

    await expect(loppuselvitysPage.locators.asiatarkastettu).toBeVisible()
    await expect(
      loppuselvitysPage.locators.otantatarkastus.routedToTaloustarkastusMessage
    ).toBeVisible()
    await expect(
      loppuselvitysPage.locators.otantatarkastus.routedToTaloustarkastusMessage
    ).toContainText('riskiperusteinen otanta')

    // Taloustarkastus should be visible for riskiperusteinen
    await expect(loppuselvitysPage.locators.taloustarkastus.accept).toBeVisible()
  })

  test('otannan ulkopuolella: all checked approves atomically in single request', async ({
    page,
    avustushakuID,
    acceptedHakemus: { hakemusID },
    loppuselvitysSubmitted,
  }) => {
    expect(loppuselvitysSubmitted).toBeDefined()

    const loppuselvitysPage = LoppuselvitysPage(page)
    await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID)

    // Check all items - email form appears
    await loppuselvitysPage.checkAllChecklistItems()
    await loppuselvitysPage.locators.asiatarkastus.acceptMessage.fill('Kaikki kunnossa')

    await expect(loppuselvitysPage.locators.otantatarkastus.approvalEmailForm).toBeVisible()

    const [verifyResponse] = await Promise.all([
      page.waitForResponse(
        (resp) =>
          resp.url().includes('/loppuselvitys/verify-information') &&
          resp.request().method() === 'POST'
      ),
      loppuselvitysPage.locators.otantatarkastus.approvalConfirm.click(),
    ])

    const responseBody = await verifyResponse.json()
    const otantaPolku = responseBody['otanta-polku']
    expect(['otannan-ulkopuolella', 'satunnaisotanta']).toContain(otantaPolku)

    await expect(loppuselvitysPage.locators.asiatarkastettu).toBeVisible()

    if (otantaPolku === 'otannan-ulkopuolella') {
      await expect(loppuselvitysPage.locators.otantatarkastus.accepted).toBeVisible()
      await expect(loppuselvitysPage.locators.taloustarkastus.accept).toBeHidden()

      // Verify acceptance email was sent
      await expect
        .poll(
          async () => {
            const emails = await getSelvitysEmailsWithLoppuselvitysSubject(avustushakuID)
            return emails.length
          },
          { timeout: 10_000, intervals: [1_000] }
        )
        .toBeGreaterThanOrEqual(1)
    } else {
      // satunnaisotanta - routed to taloustarkastus
      await expect(
        loppuselvitysPage.locators.otantatarkastus.routedToTaloustarkastusMessage
      ).toBeVisible()
      await expect(loppuselvitysPage.locators.taloustarkastus.accept).toBeVisible()
    }
  })
})
