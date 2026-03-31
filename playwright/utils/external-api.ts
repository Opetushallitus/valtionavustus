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
  const res = await fetch(`${VIRKAILIJA_URL}/api/v2/external/avustushaut/?year=${year}`)
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`)
  }
  return (await res.json()) as ExternalAvustushaku[]
}

export const getHakemuksetForAvustushaku = async (id: number) => {
  const res = await fetch(`${VIRKAILIJA_URL}/api/v2/external/avustushaku/${id}/hakemukset`)
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`)
  }
  return (await res.json()) as ExternalHakemus[]
}
