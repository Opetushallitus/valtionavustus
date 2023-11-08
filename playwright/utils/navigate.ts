import { Page } from '@playwright/test'
import { HAKIJA_URL, VIRKAILIJA_URL } from './constants'

export async function navigate(page: Page, path: string, waitForNetworkIdle?: boolean) {
  const opts = waitForNetworkIdle
    ? ({
        waitUntil: 'networkidle',
      } as const)
    : undefined
  return await navigateWithOptions(page, path, opts)
}

type GotoParams = Parameters<Page['goto']>
type GotoOptions = GotoParams[1]

export async function navigateWithOptions(page: Page, path: string, opts: GotoOptions) {
  return await page.goto(`${VIRKAILIJA_URL}${path}`, opts)
}

export async function navigateHakija(page: Page, path: string) {
  return await page.goto(`${HAKIJA_URL}${path}`)
}
