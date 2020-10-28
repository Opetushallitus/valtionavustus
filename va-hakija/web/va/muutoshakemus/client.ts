import axios from 'axios'
import {AvustuksenKayttoajanPidennys} from './store/context'

const timeout = 10000 // 10 seconds
const client = axios.create({ timeout })

type HaeKayttoajanPidennystaProps = {
  avustushakuId: number
  hakemusVersion: number
  userKey: string
  params: AvustuksenKayttoajanPidennys
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
