import axios from 'axios'

import {
  VIRKAILIJA_URL
} from '../utils/constants'

function getUniqueFileName(): string {
  return `va_${new Date().getTime()}.xml`
}

export async function putMaksupalauteToMaksatuspalveluAndProcessIt(xml: string): Promise<void> {
  await axios.post(`${VIRKAILIJA_URL}/api/test/process-maksupalaute`, {
    // The XML parser fails if the input doesn't start with "<?xml " hence the trimLeft
    xml: xml.trimLeft(),
    filename: getUniqueFileName()
  })
}

export async function getAllMaksatuksetFromMaksatuspalvelu(): Promise<string[]> {
  const resp = await axios.get<{maksatukset: string[]}>(`${VIRKAILIJA_URL}/api/test/get-sent-maksatukset`)
  return resp.data.maksatukset
}

export async function removeStoredPitkäviiteFromAllAvustushakuPayments(avustushakuId: number): Promise<void> {
  await axios.post(`${VIRKAILIJA_URL}/api/test/remove-stored-pitkaviite-from-all-avustushaku-payments`, { avustushakuId })
}

