import { APIRequestContext } from '@playwright/test'
import { VIRKAILIJA_URL } from '../../utils/constants'

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
  await request.post(`${VIRKAILIJA_URL}/api/test/process-maksupalaute`, {
    data,
    timeout: 30000,
    failOnStatusCode: true,
  })
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
