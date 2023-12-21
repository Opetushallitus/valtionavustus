import { APIRequestContext, expect } from '@playwright/test'
import { VIRKAILIJA_URL } from '../../utils/constants'

const SECOND_IN_MILLIS = 1000
const MINUTE_IN_MILLIS = 60 * SECOND_IN_MILLIS

function getUniqueFileName(): string {
  return `va_${new Date().getTime()}.xml`
}

export async function putMaksupalauteToMaksatuspalveluAndProcessIt(
  request: APIRequestContext,
  xml: string
): Promise<void> {
  const data = {
    // The XML parser fails if the input doesn't start with "<?xml " hence the trimLeft
    xml: xml.trimStart(),
    filename: getUniqueFileName(),
  }

  async function postMaksupalaute() {
    try {
      await request.post(`${VIRKAILIJA_URL}/api/test/process-maksupalaute`, {
        data,
        timeout: SECOND_IN_MILLIS * 30,
        failOnStatusCode: true,
      })
      return true
    } catch (e) {
      return false
    }
  }

  await expect.poll(postMaksupalaute, { timeout: MINUTE_IN_MILLIS * 5 }).toBeTruthy()
}

export async function getAllMaksatuksetFromMaksatuspalvelu(
  request: APIRequestContext
): Promise<string[]> {
  const res = await request.get(`${VIRKAILIJA_URL}/api/test/get-sent-maksatukset`, {
    timeout: 60000,
    failOnStatusCode: true,
  })
  const { maksatukset } = await res.json()
  return maksatukset
}
