import axios from 'axios'
import {AvustuksenKayttoajanPidennysInput} from './components/jatkoaika/AvustuksenKayttoajanPidennys'

const timeout = 10000 // 10 seconds
const client = axios.create({ timeout })

type HaeKayttoajanPidennystaProps = {
  avustushakuId: number
  userKey: string
  params: AvustuksenKayttoajanPidennysInput
}

export async function haeKayttoajanPidennysta({avustushakuId, userKey, params} : HaeKayttoajanPidennystaProps) {
  const url = `api/avustushaku/${avustushakuId}/jatkoaika/${userKey}`

  return client.post(url, {
    haenKayttoajanPidennysta: params.haenKayttoajanPidennysta,
    toivottuPaattymispaiva: params.toivottuPaattymispaiva || null,
    perustelut: params.perustelut || null
  })
}
