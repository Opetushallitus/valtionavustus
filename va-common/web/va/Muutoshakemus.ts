import moment, {Moment} from 'moment'
import { Muutoshakemus } from '../../../va-hakija/web/va/muutoshakemus/types' // TODO: Move to common

const format = 'YYYY-MM-DD'

export function getLatestApprovedMuutoshakemusDate(muutoshakemukset: Muutoshakemus[]): Moment | undefined {
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
