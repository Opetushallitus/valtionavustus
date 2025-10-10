import { APIRequestContext, expect } from '@playwright/test'

import { VIRKAILIJA_URL } from '../../utils/constants'

import { getLoppuselvitysTaloustarkastamattaEmails } from '../../utils/emails'
import { selvitysTest as test } from '../../fixtures/selvitysTest'

const sendLoppuselvitysTaloustarkastamattaNotifications = (request: APIRequestContext) =>
  request.post(`${VIRKAILIJA_URL}/api/test/send-loppuselvitys-taloustarkastamatta-notifications`)

test('loppuselvitys-taloustarkastamatta notification is sent', async ({
  avustushakuID,
  loppuselvitysSubmitted: { loppuselvitysFormFilled },
  asiatarkastus: { asiatarkastettu },
  request,
}) => {
  expect(asiatarkastettu === true)
  expect(loppuselvitysFormFilled)
  const oldEmailCount = (await getLoppuselvitysTaloustarkastamattaEmails(avustushakuID)).length
  expect(oldEmailCount).toEqual(0)
  await sendLoppuselvitysTaloustarkastamattaNotifications(request)

  const emails = await getLoppuselvitysTaloustarkastamattaEmails(avustushakuID)
  expect(emails.length).toEqual(1)

  const loppuselvitysAsiatarkastamattaNotification = emails.at(0)
  expect(loppuselvitysAsiatarkastamattaNotification).toBeDefined()
  expect(loppuselvitysAsiatarkastamattaNotification?.subject).toEqual(
    'Taloustarkastamattomia loppuselvityksiä'
  )
  expect(loppuselvitysAsiatarkastamattaNotification?.['to-address']).toEqual([
    'talouspalvelut@localhost',
  ])
})
