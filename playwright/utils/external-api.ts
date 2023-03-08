import axios from 'axios'

import { VIRKAILIJA_URL } from './constants'

type ExternalAvustushaku = {
  id: number
  'hankkeen-alkamispaiva': string
  'hankkeen-paattymispaiva': string
}

type ExternalHakemus = {
  id: number
}

export const getAvustushautForYear = async (year: number) => {
  const res = await axios.get<ExternalAvustushaku[]>(
    `${VIRKAILIJA_URL}/api/v2/external/avustushaut/?year=${year}`
  )
  return res.data
}

export const getHakemuksetForAvustushaku = async (id: number) => {
  const res = await axios.get<ExternalHakemus[]>(
    `${VIRKAILIJA_URL}/api/v2/external/avustushaku/${id}/hakemukset`
  )
  return res.data
}
