import axios from 'axios'
import {AvustuksenKayttoajanPidennysInput} from './components/jatkoaika/AvustuksenKayttoajanPidennys'

const timeout = 10000 // 10 seconds
const client = axios.create({ timeout })

export async function haeKayttoajanPidennysta(params: AvustuksenKayttoajanPidennysInput) {
  const url = `api/avustushaku/8/jatkoaika`

  return client.post(url, {
    haenKayttoajanPidennysta: params.haenKayttoajanPidennysta,
    toivottuPaattymispaiva: params.toivottuPaattymispaiva || null,
    perustelut: params.perustelut || null
  })
}
