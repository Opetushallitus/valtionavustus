import moment, {Moment} from 'moment'
import { Muutoshakemus } from './types/muutoshakemus'

const format = 'YYYY-MM-DD'

interface Avustushaku {
  'hankkeen-paattymispaiva' : string
}

export function getProjectEndDate(avustushaku: Avustushaku, muutoshakemukset: Muutoshakemus[] | undefined): string | undefined {
  const latestAcceptedMuutoshakemus = getLatestApprovedMuutoshakemusDate(muutoshakemukset)

  const date = latestAcceptedMuutoshakemus ? latestAcceptedMuutoshakemus : moment(avustushaku['hankkeen-paattymispaiva'], format)
  return toFinnishDateFormat(date)
}

function getLatestApprovedMuutoshakemusDate(muutoshakemukset: Muutoshakemus[] | undefined): Moment | undefined {
  if (!muutoshakemukset) return undefined

  function first(muutoshakemukset: Muutoshakemus[]): Muutoshakemus | undefined {
    return [...muutoshakemukset].shift()
  }

  function sortByCreatedAtDescending(muutoshakemukset: Muutoshakemus[]): Muutoshakemus[] {
    return [...muutoshakemukset].sort((m1, m2) => m1["created-at"] > m2["created-at"] ? -1 : 1)
  }

  const acceptedMuutoshakemukset = muutoshakemukset.filter(m => m.status === 'accepted' || m.status === 'accepted_with_changes')
  const latestAcceptedMuutoshakemus = first(sortByCreatedAtDescending(acceptedMuutoshakemukset))

  if (!latestAcceptedMuutoshakemus) return undefined

  return latestAcceptedMuutoshakemus.status === 'accepted_with_changes' ?
    moment(latestAcceptedMuutoshakemus["paatos-hyvaksytty-paattymispaiva"], format) :
    moment(latestAcceptedMuutoshakemus["haettu-kayttoajan-paattymispaiva"], format)
}

function toFinnishDateFormat(date: { isValid: () => boolean, format: (string) => string  }): string | undefined {
  return date.isValid() ? date.format('DD.MM.YYYY') : undefined
}
