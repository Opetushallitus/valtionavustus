import { Page } from '@playwright/test'
import { HAKIJA_URL } from './constants'

export async function getNormalizedHakemus(
  page: Page,
  avustushakuID: number,
  userKey: string
): Promise<NormalizedHakemus> {
  const resp = await page.request.get(
    `${HAKIJA_URL}/api/avustushaku/${avustushakuID}/hakemus/${userKey}/normalized`
  )
  return await resp.json()
}

interface NormalizedHakemus {
  'updated-at': string
  'project-name': string
  'register-number': string
  'hakemus-id': number
  'contact-phone': string
  talousarvio: []
  'organization-name': string
  'contact-email': string
  id: number
  'contact-person': string
  'created-at': string
}
