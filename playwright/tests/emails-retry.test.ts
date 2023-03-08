import { APIRequestContext, test, expect } from '@playwright/test'
import { VIRKAILIJA_URL } from '../utils/constants'
import { emailSchema } from '../utils/emails'

test.describe('Email sending retry mechanism', () => {
  test('retries to send email failed to be sent', async ({ request }) => {
    await deleteEmailsAndEmailEvents(request)
    expect(await getEmailsThatFailedToBeSent(request)).toHaveLength(0)
    expect(await getEmailsThatSucceededToBeSent(request)).toHaveLength(0)
    const count = 5
    await generateEmailsThatFailedToBeSent(request, count)
    expect(await getEmailsThatFailedToBeSent(request)).toHaveLength(count)

    await retryToSendEmail(request)

    expect(await getEmailsThatFailedToBeSent(request)).toHaveLength(0)
    expect(await getEmailsThatSucceededToBeSent(request)).toHaveLength(count)
  })
})

async function deleteEmailsAndEmailEvents(request: APIRequestContext) {
  await request.post(`${VIRKAILIJA_URL}/api/test/email/delete-generated-emails-and-events`, {
    failOnStatusCode: true,
  })
}

async function getGeneratedEmails(value: unknown) {
  const generatedEmailSubject = 's'
  const emails = await emailSchema.validate(value)
  return emails.filter((email) => email.subject === generatedEmailSubject)
}

async function getEmailsThatFailedToBeSent(request: APIRequestContext) {
  const res = await request.get(`${VIRKAILIJA_URL}/api/test/email/sent/failed`)
  return getGeneratedEmails(await res.json())
}

async function getEmailsThatSucceededToBeSent(request: APIRequestContext) {
  const res = await request.get(`${VIRKAILIJA_URL}/api/test/email/sent/succeeded`)
  return getGeneratedEmails(await res.json())
}

async function generateEmailsThatFailedToBeSent(request: APIRequestContext, count: number) {
  await request.post(`${VIRKAILIJA_URL}/api/test/email/generate-emails-that-failed-to-be-sent`, {
    data: { count },
  })
}

async function retryToSendEmail(request: APIRequestContext) {
  await request.post(`${VIRKAILIJA_URL}/api/test/email/retry-to-send-email`, {
    failOnStatusCode: true,
  })
}
