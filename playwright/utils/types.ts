import { Moment } from 'moment'

export interface MuutoshakemusValues {
  jatkoaika?: Moment
  jatkoaikaPerustelu: string
}

export type PaatosStatus = 'accepted' | 'accepted_with_changes' | 'rejected'

export interface PaatosValues {
  status: PaatosStatus
}

export type Field = { type: string; fieldId: string }
type FieldAnswer = { fieldId: string; answer: string; isFileAttachment?: boolean }

export interface Answers {
  organization?: string
  projectName?: string
  contactPersonName: string
  contactPersonEmail: string
  contactPersonPhoneNumber: string
  signatories?: Signatory[]
  lang?: 'fi' | 'sv'

  hakemusFields?: FieldAnswer[]
}

export interface Signatory {
  name: string
  email: string
}

export interface VaCodeValues {
  operationalUnit: string
  operationalUnitName?: string
  project: string[]
}

export const NoProjectCodeProvided = {
  code: '0000000000000000',
  name: 'Ei projektikoodia',
}
