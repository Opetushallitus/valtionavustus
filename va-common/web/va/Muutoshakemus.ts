import moment, { Moment } from 'moment'
import {Muutoshakemus, NormalizedHakemus, Talousarvio} from './types/muutoshakemus'

export interface Avustushaku {
  'hankkeen-paattymispaiva' : string
}

export function getProjectEndDate(avustushaku: Avustushaku, muutoshakemukset?: Muutoshakemus[]): string | undefined {
  return toFinnishDateFormat(getProjectEndMoment(avustushaku, muutoshakemukset))
}

export function getSecondLatestProjectEndDate(avustushaku: Avustushaku, muutoshakemukset?: Muutoshakemus[]): string | undefined {
  const secondLatestFromMuutoshakemukset = getNthLatestProjectEndDate(muutoshakemukset, 1)
  const secondLatest = secondLatestFromMuutoshakemukset ? secondLatestFromMuutoshakemukset : dateStringToMoment(avustushaku['hankkeen-paattymispaiva'])
  return toFinnishDateFormat(secondLatest)
}

export function getProjectEndMoment(avustushaku: Avustushaku, muutoshakemukset?: Muutoshakemus[]): Moment {
  const latestAcceptedMuutoshakemus = getNthLatestProjectEndDate(muutoshakemukset)
  return latestAcceptedMuutoshakemus ? latestAcceptedMuutoshakemus : dateStringToMoment(avustushaku['hankkeen-paattymispaiva'])
}

function acceptedTalousarvioFilter(m: Muutoshakemus) {
  return m.talousarvio && (m.status === 'accepted' || m.status === 'accepted_with_changes')
}

function getNthApprovedMuutoshakemusWithTalousarvio(muutoshakemukset: Muutoshakemus[], nth?: number): Muutoshakemus | undefined {
  const index = nth || 0
  const acceptedMuutoshakemukset = muutoshakemukset.filter(acceptedTalousarvioFilter)
  if (acceptedMuutoshakemukset.length < index + 1) return undefined

  return sortByCreatedAtDescending(acceptedMuutoshakemukset)[index]
}

export function getTalousarvio(muutoshakemukset: Muutoshakemus[], hakemus?: NormalizedHakemus): Talousarvio {
  const latestAcceptedMuutoshakemus = getNthApprovedMuutoshakemusWithTalousarvio(muutoshakemukset)
  return latestAcceptedMuutoshakemus?.talousarvio || hakemus?.talousarvio || []
}

export function getSecondLatestTalousarvio(muutoshakemukset: Muutoshakemus[], hakemus?: NormalizedHakemus): Talousarvio {
  const secondLatestAcceptedMuutoshakemus = getNthApprovedMuutoshakemusWithTalousarvio(muutoshakemukset, 1)
  return secondLatestAcceptedMuutoshakemus?.talousarvio || hakemus?.talousarvio || []
}

function sortByCreatedAtDescending(muutoshakemukset: Muutoshakemus[]): Muutoshakemus[] {
  return [...muutoshakemukset].sort((m1, m2) => m1["created-at"] > m2["created-at"] ? -1 : 1)
}

function getNthLatestProjectEndDate(muutoshakemukset: Muutoshakemus[] | undefined, nth?: number): Moment | undefined {
  if (!muutoshakemukset) return undefined
  const index = nth || 0
  const acceptedWithProjectEnd = muutoshakemukset.filter(m => (m.status === 'accepted' || m.status === 'accepted_with_changes') && m['haen-kayttoajan-pidennysta'])
  if (acceptedWithProjectEnd.length >= index + 1) {
    const latestAcceptedMuutoshakemus = sortByCreatedAtDescending(acceptedWithProjectEnd)[index]
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
