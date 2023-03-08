import { Answer, Avustushaku, NormalizedHakemusData } from './types'
import { Muutoshakemus } from './types/muutoshakemus'
import { getProjectEndDate } from './Muutoshakemus'

export function mapAnswersWithMuutoshakemusData(
  avustushaku: Avustushaku,
  answers: Answer[],
  muutoshakemukset: Muutoshakemus[] | undefined,
  normalizedData: NormalizedHakemusData | undefined
): Answer[] {
  const projectEnd = getProjectEndDate(avustushaku, muutoshakemukset)
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
