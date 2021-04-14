import moment, { Moment } from 'moment'
import { Muutoshakemus } from './types/muutoshakemus'

export interface Avustushaku {
  'hankkeen-paattymispaiva' : string
}

export function getProjectEndDate(avustushaku: Avustushaku, muutoshakemukset: Muutoshakemus[] | undefined): string | undefined {
  return toFinnishDateFormat(getProjectEndMoment(avustushaku, muutoshakemukset))
}

export function getProjectEndMoment(avustushaku: Avustushaku, muutoshakemukset: Muutoshakemus[] | undefined): Moment {
  const latestAcceptedMuutoshakemus = getLatestApprovedProjectEndDate(muutoshakemukset)
  return latestAcceptedMuutoshakemus ? latestAcceptedMuutoshakemus : dateStringToMoment(avustushaku['hankkeen-paattymispaiva'])
}

function sortByCreatedAtDescending(muutoshakemukset: Muutoshakemus[]): Muutoshakemus[] {
  return [...muutoshakemukset].sort((m1, m2) => m1["created-at"] > m2["created-at"] ? -1 : 1)
}

function getLatestApprovedProjectEndDate(muutoshakemukset: Muutoshakemus[] | undefined): Moment | undefined {
  if (!muutoshakemukset) return undefined

  const acceptedWithProjectEnd = muutoshakemukset.filter(m => (m.status === 'accepted' || m.status === 'accepted_with_changes') && m['haen-kayttoajan-pidennysta'])
  if (acceptedWithProjectEnd.length) {
    const latestAcceptedMuutoshakemus = sortByCreatedAtDescending(acceptedWithProjectEnd)[0]
    return latestAcceptedMuutoshakemus.status === 'accepted_with_changes'
      ? dateStringToMoment(latestAcceptedMuutoshakemus["paatos-hyvaksytty-paattymispaiva"])
      : dateStringToMoment(latestAcceptedMuutoshakemus["haettu-kayttoajan-paattymispaiva"])
  } else {
    return undefined
  }
}

export function dateStringToMoment(date: string | undefined): Moment {
  return moment(date, 'YYYY-MM-DD')
}

export function toFinnishDateFormat(date: Moment): string | undefined {
  return date.isValid() ? date.format('DD.MM.YYYY') : undefined
}
