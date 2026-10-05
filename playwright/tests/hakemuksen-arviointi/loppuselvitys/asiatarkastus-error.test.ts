import { expect } from '@playwright/test'
import { selvitysTest } from '../../../fixtures/selvitysTest'
import { LoppuselvitysPage } from '../../../pages/virkailija/hakujen-hallinta/LoppuselvitysPage'
import { VIRKAILIJA_URL } from '../../../utils/constants'

const errorMessage = 'Asiatarkastuksen hyväksyminen epäonnistui'

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

for (const variant of ['two-stage', 'satunnaisotanta', 'risk', 'direct'] as const) {
  const test = selvitysTest.extend({ enableOtantatarkastus: variant !== 'two-stage' })

  test(`asiatarkastus retries failures but prevents resubmission during a slow refresh (${variant})`, async ({
    page,
    request,
    avustushakuID,
    acceptedHakemus: { hakemusID },
    loppuselvitysSubmitted,
  }) => {
    expect(loppuselvitysSubmitted).toBeDefined()
    if (variant !== 'two-stage') {
      const response = await request.post(
        `${VIRKAILIJA_URL}/api/test/set-loppuselvitys-otantapolku`,
        {
          data: {
            'hakemus-id': hakemusID,
            otantapolku: variant === 'satunnaisotanta' ? 'satunnaisotanta' : 'otannan-ulkopuolella',
          },
        }
      )
      expect(response.ok()).toBeTruthy()
    }

    const loppuselvitysPage = LoppuselvitysPage(page)
    await loppuselvitysPage.navigateToLoppuselvitysTab(avustushakuID, hakemusID)
    if (variant !== 'two-stage') await loppuselvitysPage.checkAllChecklistItems()
    if (variant === 'risk') {
      await page.locator('label[for="avustus-kaytetty-paatoksen-mukaisesti-false"]').click()
    }
    if (variant === 'two-stage' || variant === 'risk') {
      await loppuselvitysPage.locators.asiatarkastus.acceptMessage.fill('Asiatarkastuksen huomiot')
    }
    const button =
      variant === 'direct'
        ? loppuselvitysPage.locators.otantatarkastus.approvalConfirm
        : loppuselvitysPage.locators.asiatarkastus.confirmAcceptance

    // A rejected approval must release the lock so the same form can be retried.
    await page.route(
      '**/loppuselvitys/verify-information',
      (route) => route.fulfill({ status: 400, json: { error: 'Rejected request' } }),
      { times: 1 }
    )
    await button.click()
    await expect(page.getByText(errorMessage)).toBeVisible()
    await expect(button).toBeEnabled()
    await expect(loppuselvitysPage.locators.asiatarkastettu).toBeHidden()

    // Observe every DOM update: checking only the final state misses transient errors.
    await page.evaluate((message) => {
      document.addEventListener(
        'submit',
        () => {
          new MutationObserver((mutations) => {
            for (const mutation of mutations) {
              for (const node of [mutation.target, ...mutation.addedNodes]) {
                if (node.textContent?.includes(message)) {
                  document.body.dataset.approvalError = 'true'
                }
              }
            }
          }).observe(document.body, { childList: true, subtree: true, characterData: true })
        },
        { once: true, capture: true }
      )
    }, errorMessage)

    const postGate = deferred()
    const refreshGate = deferred()
    let postStatus: number | undefined
    let refreshStatus: number | undefined
    let postCount = 0
    await page.route('**/loppuselvitys/verify-information', async (route) => {
      postCount++
      const response = await route.fetch()
      postStatus = response.status()
      await postGate.promise
      await route.fulfill({ response })
    })
    await page.route(`${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}`, async (route) => {
      const response = await route.fetch()
      refreshStatus = response.status()
      await refreshGate.promise
      await route.fulfill({ response })
    })

    try {
      await button.click()
      await expect.poll(() => postStatus).toBe(200)
      await expect(button).toBeDisabled()
      // Also guard the handler itself, not just clicks on the disabled button.
      await button.evaluate((element) => element.closest('form')!.requestSubmit())
      postGate.resolve()

      await expect.poll(() => refreshStatus).toBe(200)
      await expect(button).toBeDisabled()
      await button.evaluate((element) => element.closest('form')!.requestSubmit())
      await expect(page.getByText(errorMessage)).toBeHidden()
      refreshGate.resolve()

      await expect(loppuselvitysPage.locators.asiatarkastettu).toBeVisible()
      if (variant === 'direct') {
        await expect(loppuselvitysPage.locators.otantatarkastus.accepted).toBeVisible()
      }
      await expect(page.getByText(errorMessage)).toBeHidden()
      expect(await page.locator('body').getAttribute('data-approval-error')).toBeNull()
      expect(postCount).toBe(1)
    } finally {
      postGate.resolve()
      refreshGate.resolve()
      await page.unrouteAll({ behavior: 'ignoreErrors' })
    }
  })
}
