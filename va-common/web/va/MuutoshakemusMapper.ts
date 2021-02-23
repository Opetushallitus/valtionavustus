
import moment from 'moment'

import { Answer, Muutoshakemus, NormalizedHakemusData } from './types'

export function getProjectEnd(muutoshakemus?: Muutoshakemus) {
  if (muutoshakemus?.status === 'accepted') {
    return muutoshakemus?.['haen-kayttoajan-pidennysta'] && moment(muutoshakemus?.['haettu-kayttoajan-paattymispaiva']).format('DD.MM.YYYY')
  }
  if (muutoshakemus?.status === 'accepted_with_changes') {
    return muutoshakemus?.['paatos-hyvaksytty-paattymispaiva'] && moment(muutoshakemus?.['paatos-hyvaksytty-paattymispaiva']).format('DD.MM.YYYY')
  }
  return undefined
}

export function mapAnswersWithMuutoshakemusData(answers: Answer[], muutoshakemukset: Muutoshakemus[] | undefined, normalizedData: NormalizedHakemusData | undefined): Answer[] {
  const acceptedMuutoshakemus = muutoshakemukset?.find(m => m.status === 'accepted' || m.status === 'accepted_with_changes')
  const projectEnd = getProjectEnd(acceptedMuutoshakemus)
  return JSON.parse(JSON.stringify(answers)).map((a: Answer) => {
    switch (a.key) {
      case 'project-end':
        return projectEnd ? { ...a, value: projectEnd } : a
      case 'applicant-name':
        return normalizedData ? { ...a, value: normalizedData['contact-person'] } : a
      case 'primary-email':
        return normalizedData ? { ...a, value: normalizedData['contact-email'] } : a
      case 'textField-0':
        return normalizedData ? { ...a, value: normalizedData['contact-phone'] } : a
      default:
        return a
    }
  })
}
