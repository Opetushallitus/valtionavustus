import { APIRequestContext, expect } from '@playwright/test'

import { VIRKAILIJA_URL } from '../../utils/constants'

import { Email, getLoppuselvitysAsiatarkastamattaEmails } from '../../utils/emails'
import { selvitysTest as test } from '../../fixtures/selvitysTest'

const sendLoppuselvitysAsiatarkastamattaNotifications = (request: APIRequestContext) =>
  request.post(`${VIRKAILIJA_URL}/api/test/send-loppuselvitys-asiatarkastamatta-notifications`, {
    failOnStatusCode: true,
  })

const getHakemusNotificationContext = async (
  request: APIRequestContext,
  avustushakuID: number,
  hakemusID: number
) =>
  request
    .get(`${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}`, { failOnStatusCode: true })
    .then(async (response) => {
      const hakuData = (await response.json()) as {
        hakemukset?: Array<{
          id: number
          'status-loppuselvitys'?: string
          arvio?: { 'presenter-role-id'?: number }
        }>
        roles?: Array<{
          id: number
          name: string
          email?: string | null
          role: string
          oid?: string | null
        }>
      }
      const hakemus = hakuData.hakemukset?.find((h) => h.id === hakemusID)
      const presenterRoleId = hakemus?.arvio?.['presenter-role-id']
      const presenterRole = hakuData.roles?.find((role) => role.id === presenterRoleId)
      return {
        loppuselvitysStatus: hakemus?.['status-loppuselvitys'],
        presenterRole,
      }
    })

test('loppuselvitys-asiatarkastamatta notification is sent to virkailija when loppuselvitys is submitted but asiatarkastus is missing', async ({
  avustushakuID,
  acceptedHakemus: { hakemusID },
  loppuselvitysSubmitted: { loppuselvitysFormFilled },
  request,
}) => {
  expect(loppuselvitysFormFilled).toBeTruthy()
  await expect
    .poll(
      async () =>
        (await getHakemusNotificationContext(request, avustushakuID, hakemusID))
          .loppuselvitysStatus,
      {
        timeout: 60_000,
        intervals: [2000],
      }
    )
    .toEqual('submitted')

  const { presenterRole } = await getHakemusNotificationContext(request, avustushakuID, hakemusID)
  expect(presenterRole).toBeDefined()
  if (!presenterRole?.email) {
    await request.post(
      `${VIRKAILIJA_URL}/api/avustushaku/${avustushakuID}/role/${presenterRole.id}`,
      {
        data: {
          ...presenterRole,
          email: 'santeri.horttanainen@reaktor.com',
        },
        failOnStatusCode: true,
      }
    )
  }

  const oldEmailIds = new Set(
    (await getLoppuselvitysAsiatarkastamattaEmails(avustushakuID)).map((email) => email.id)
  )

  let newEmails: Email[] = []
  await expect
    .poll(
      async () => {
        await sendLoppuselvitysAsiatarkastamattaNotifications(request)
        newEmails = (await getLoppuselvitysAsiatarkastamattaEmails(avustushakuID)).filter(
          (email) => !oldEmailIds.has(email.id)
        )
        return newEmails.length
      },
      { timeout: 60_000, intervals: [3000] }
    )
    .toBeGreaterThan(0)

  const loppuselvitysAsiatarkastamattaNotification = newEmails.find((email) =>
    email.formatted.includes(`${VIRKAILIJA_URL}/avustushaku/${avustushakuID}/`)
  )
  expect(loppuselvitysAsiatarkastamattaNotification).toBeDefined()
  expect(loppuselvitysAsiatarkastamattaNotification?.subject).toEqual(
    'Asiatarkastamattomia loppuselvityksiä'
  )
  expect(loppuselvitysAsiatarkastamattaNotification?.formatted).toContain(
    `${VIRKAILIJA_URL}/avustushaku/${avustushakuID}/`
  )
})
