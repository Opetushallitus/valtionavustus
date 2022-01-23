import axios from 'axios'
import { VIRKAILIJA_URL } from './test-util'

describe('Email sending retry mechanism', () => {
  beforeEach(async () => {
    deleteEmailsAndEmailEvents()
    expect(await getEmailsThatFailedToBeSent()).toHaveLength(0)
    expect(await getEmailsThatSucceededToBeSent()).toHaveLength(0)
  })

  it('retries to send email failed to be sent', async() => {
    const count = 5
    await generateEmailsThatFailedToBeSent(count)
    expect(await getEmailsThatFailedToBeSent()).toHaveLength(count)

    await retryToSendEmail()

    expect(await getEmailsThatFailedToBeSent()).toHaveLength(0)
    expect(await getEmailsThatSucceededToBeSent()).toHaveLength(count)
  })
})

async function deleteEmailsAndEmailEvents() {
  return axios.post(`${VIRKAILIJA_URL}/api/test/email/delete-emails-and-events`).then(r => r.data)
}

async function getEmailsThatFailedToBeSent() {
  return axios.get(`${VIRKAILIJA_URL}/api/test/email/sent/failed`).then(r => r.data)
}

async function getEmailsThatSucceededToBeSent() {
  return axios.get(`${VIRKAILIJA_URL}/api/test/email/sent/succeeded`).then(r => r.data)
}

async function generateEmailsThatFailedToBeSent(count: number) {
  return axios.post(`${VIRKAILIJA_URL}/api/test/email/generate-emails-that-failed-to-be-sent`, { count }).then(r => r.data)
}

async function retryToSendEmail() {
  return axios.post(`${VIRKAILIJA_URL}/api/test/email/retry-to-send-email`).then(r => r.data)
}

