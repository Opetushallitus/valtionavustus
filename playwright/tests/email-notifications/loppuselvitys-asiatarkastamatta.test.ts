import { APIRequestContext, expect } from '@playwright/test'

import { VIRKAILIJA_URL } from '../../utils/constants'

import { Email, getLoppuselvitysAsiatarkastamattaEmails } from '../../utils/emails'
import { selvitysTest as test } from '../../fixtures/selvitysTest'

const sendLoppuselvitysAsiatarkastamattaNotifications = (request: APIRequestContext) =>
  request.post(`${VIRKAILIJA_URL}/api/test/send-loppuselvitys-asiatarkastamatta-notifications`)

test('loppuselvitys-asiatarkastamatta notification is sent to virkailija when loppuselvitys is submitted but asiatarkastus is missing', async ({
  avustushakuID,
  loppuselvitysSubmitted: { loppuselvitysFormFilled },
  request,
}) => {
  expect(loppuselvitysFormFilled)
  const oldEmailCount = (await getLoppuselvitysAsiatarkastamattaEmails(avustushakuID)).filter((e) =>
    e['to-address'].includes('santeri.horttanainen@reaktor.com')
  ).length
  await sendLoppuselvitysAsiatarkastamattaNotifications(request)

  let emails: Email[] = []
  await expect
    .poll(async () => {
      emails = (await getLoppuselvitysAsiatarkastamattaEmails(avustushakuID)).filter((e) =>
        e['to-address'].includes('santeri.horttanainen@reaktor.com')
      )
      return emails.length
    })
    .toEqual(oldEmailCount + 1)
  const loppuselvitysAsiatarkastamattaNotification = emails.pop()
  expect(loppuselvitysAsiatarkastamattaNotification?.subject).toEqual(
    'Asiatarkastamattomia loppuselvityksiä'
  )
  expect(loppuselvitysAsiatarkastamattaNotification?.formatted).toContain(
    `${VIRKAILIJA_URL}/avustushaku/${avustushakuID}/`
  )
})
