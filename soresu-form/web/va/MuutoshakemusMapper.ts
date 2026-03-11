import { Answer, Avustushaku, NormalizedHakemusData } from './types'
import { Muutoshakemus } from './types/muutoshakemus'
import { getProjectEndDate } from './Muutoshakemus'
import { mapOtherOrganizationsAnswerValue } from './yhteishankeOrganizations'

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
      case 'trusted-contact-name': {
        return normalizedData ? { ...a, value: normalizedData['trusted-contact-name'] } : a
      }
      case 'trusted-contact-email': {
        return normalizedData ? { ...a, value: normalizedData['trusted-contact-email'] } : a
      }
      case 'trusted-contact-phone': {
        return normalizedData ? { ...a, value: normalizedData['trusted-contact-phone'] } : a
      }
      case 'other-organizations': {
        const organizations = normalizedData?.['yhteishanke-organizations']
        return normalizedData && Array.isArray(organizations)
          ? { ...a, value: mapOtherOrganizationsAnswerValue(a.value, organizations) }
          : a
      }
      default:
        return a
    }
  })
}
