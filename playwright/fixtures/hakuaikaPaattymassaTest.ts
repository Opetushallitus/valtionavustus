import { Page } from '@playwright/test'
import { VIRKAILIJA_URL } from '../utils/constants'
import { muutoshakemusTest } from './muutoshakemusTest'
import { randomString } from '../utils/random'
import { createJotpaCodes } from './JotpaTest'

export const sendHakuaikaPaattymassaNotifications = (page: Page) =>
  page.request.post(`${VIRKAILIJA_URL}/api/test/send-hakuaika-paattymassa-notifications`)

type HakuaikaPaattymassaFixtures = {
  randomEmail: string
}

export const hakuaikaPaattymassaTest = muutoshakemusTest.extend<HakuaikaPaattymassaFixtures>({
  randomEmail: async ({}, use) => {
    await use(`${randomString()}@example.com`)
  },
  answers: async ({ answers, randomEmail }, use) => {
    await use({
      ...answers,
      contactPersonEmail: randomEmail,
    })
  },
})

export const jotpaHakuaikaPaattymassaTest = hakuaikaPaattymassaTest.extend({
  codes: async ({ page }, use) => {
    const codes = await createJotpaCodes(page)
    await use(codes)
  },
})
