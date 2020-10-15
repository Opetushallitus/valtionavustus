import axios from 'axios'

const axios_timeout = 10000 // 10 seconds

const client = axios.create({
  timeout: axios_timeout
})

type Jatkoaika = {
  toivottuPaattymispaiva?: string
  perustelut?: string
}

export async function haeJatkoaikaa(params: Jatkoaika) {
  const url = `api/avustushaku/8/jatkoaika`

  return client.post(url, {
    toivottuPaattymispaiva: params.toivottuPaattymispaiva || null,
    perustelut: params.perustelut || null
  })
}
