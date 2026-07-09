import { APIRequestContext, expect, Page } from '@playwright/test'
import { HAKIJA_URL, VIRKAILIJA_URL } from './constants'

export async function setHakemusOrganization(
  request: APIRequestContext,
  hakemusID: number,
  fields: { businessId?: string | null; orgEmail?: string }
) {
  const data: Record<string, unknown> = { 'hakemus-id': hakemusID }
  if ('businessId' in fields) data['business-id'] = fields.businessId
  if ('orgEmail' in fields) data['org-email'] = fields.orgEmail
  const res = await request.post(`${VIRKAILIJA_URL}/api/test/set-hakemus-organization`, { data })
  expect(res.ok()).toBeTruthy()
}

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
