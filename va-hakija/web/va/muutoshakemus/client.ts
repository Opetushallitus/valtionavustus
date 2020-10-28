import axios from 'axios'
import {AvustuksenKayttoajanPidennys, ChangingContactPersonDetails} from './store/context'

const timeout = 10000 // 10 seconds
const client = axios.create({ timeout })

type HaeKayttoajanPidennystaProps = {
  avustushakuId: number
  hakemusVersion: number
  userKey: string
  params: AvustuksenKayttoajanPidennys
}

interface ChangeContactPersonDetails {
  avustushakuId: number
  userKey: string
  params: ChangingContactPersonDetails
}

export async function haeKayttoajanPidennysta({avustushakuId, hakemusVersion, userKey, params} : HaeKayttoajanPidennystaProps) {
  const url = `api/muutoshaku/${avustushakuId}/jatkoaika/${userKey}`

  return client.post(url, {
    hakemusVersion: hakemusVersion,
    haenKayttoajanPidennysta: params.haenKayttoajanPidennysta,
    haettuKayttoajanPaattymispaiva: params.haettuKayttoajanPaattymispaiva || null,
    kayttoajanPidennysPerustelut: params.kayttoajanPidennysPerustelut || null
  })
}

export async function changeContactPersonDetails({avustushakuId, userKey, params} : ChangeContactPersonDetails) {
  const url = `api/avustushaku/${avustushakuId}/hakemus/${userKey}/normalized/contact-person-details`

  return client.put(url, {
    "contact-person": params.name,
    "contact-email": params.email,
    "contact-phone": params.phone
  })
}
