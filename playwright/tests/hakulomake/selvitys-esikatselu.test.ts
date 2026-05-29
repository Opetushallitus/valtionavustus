import { expect, Page } from '@playwright/test'

import { selvitysTest as test } from '../../fixtures/selvitysTest'
import {
  getLoppuselvitysSubmittedNotificationEmails,
  getValiselvitysSubmittedNotificationEmails,
  lastOrFail,
  waitUntilMinEmails,
} from '../../utils/emails'
import { HAKIJA_URL } from '../../utils/constants'

async function expectReadOnly(page: Page) {
  await expect(page.locator('div.soresu-preview')).toBeVisible()
  await expect(page.locator('#submit')).toBeHidden()
}

async function getLoppuselvitysEsikatseluUrl(hakemusID: number): Promise<string> {
  const emails = await waitUntilMinEmails(getLoppuselvitysSubmittedNotificationEmails, 1, hakemusID)
  const email = lastOrFail(emails)
  const url = email.formatted.match(/(https?:\/\/\S+)/gi)?.[0]
  if (!url) throw new Error('No esikatselu url found in loppuselvitys email')
  return url
}

test('valiselvitys esikatselu path shows submitted selvitys in read-only mode', async ({
  page,
  avustushakuID,
  väliselvitysSubmitted: { userKey },
}) => {
  await page.goto(
    `${HAKIJA_URL}/avustushaku/${avustushakuID}/valiselvitys/esikatselu/${userKey}?lang=fi`
  )

  await test.step('form is shown in read-only preview mode', async () => {
    await expectReadOnly(page)
  })

  await test.step('preview=false does not enable edit mode', async () => {
    await page.goto(
      `${HAKIJA_URL}/avustushaku/${avustushakuID}/valiselvitys/esikatselu/${userKey}?lang=fi&preview=false`
    )
    await expectReadOnly(page)
  })
})

test('valiselvitys submitted notification email contains esikatselu URL', async ({
  page,
  avustushakuID,
  acceptedHakemus: { hakemusID },
  väliselvitysSubmitted: { userKey },
}) => {
  const emails = await waitUntilMinEmails(getValiselvitysSubmittedNotificationEmails, 1, hakemusID)
  const email = lastOrFail(emails)

  expect(email.formatted).toContain(
    `${HAKIJA_URL}/avustushaku/${avustushakuID}/valiselvitys/esikatselu/${userKey}?lang=fi`
  )

  await test.step('email link opens the selvitys in read-only mode', async () => {
    const previewUrl = email.formatted.match(/(https?:\/\/\S+)/gi)?.[0]
    if (!previewUrl) throw new Error('No preview url found')
    await page.goto(previewUrl)
    await expectReadOnly(page)
  })
})

test('loppuselvitys esikatselu path shows submitted selvitys in read-only mode', async ({
  page,
  avustushakuID,
  acceptedHakemus: { hakemusID },
  loppuselvitysSubmitted: { loppuselvitysFormFilled },
}) => {
  expect(loppuselvitysFormFilled)
  const esikatseluUrl = await getLoppuselvitysEsikatseluUrl(hakemusID)
  const userKey = new URL(esikatseluUrl).pathname.match(/\/esikatselu\/([^/]+)$/)?.[1]
  if (!userKey) throw new Error('loppuselvitys selvitys user-key not found in esikatselu url')

  await test.step('form is shown in read-only preview mode', async () => {
    await page.goto(
      `${HAKIJA_URL}/avustushaku/${avustushakuID}/loppuselvitys/esikatselu/${userKey}?lang=fi`
    )
    await expectReadOnly(page)
  })

  await test.step('preview=false does not enable edit mode', async () => {
    await page.goto(
      `${HAKIJA_URL}/avustushaku/${avustushakuID}/loppuselvitys/esikatselu/${userKey}?lang=fi&preview=false`
    )
    await expectReadOnly(page)
  })
})

test('loppuselvitys submitted notification email contains esikatselu URL', async ({
  page,
  avustushakuID,
  acceptedHakemus: { hakemusID },
  loppuselvitysSubmitted: { loppuselvitysFormFilled },
}) => {
  expect(loppuselvitysFormFilled)
  const esikatseluUrl = await getLoppuselvitysEsikatseluUrl(hakemusID)

  expect(esikatseluUrl).toMatch(
    new RegExp(
      `^${HAKIJA_URL}/avustushaku/${avustushakuID}/loppuselvitys/esikatselu/[^/?]+\\?lang=fi$`
    )
  )

  await test.step('email link opens the selvitys in read-only mode', async () => {
    await page.goto(esikatseluUrl)
    await expectReadOnly(page)
  })
})
