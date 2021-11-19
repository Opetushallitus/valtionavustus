import {Moment} from "moment";

export interface MuutoshakemusValues {
  jatkoaika?: Moment,
  jatkoaikaPerustelu: string
}

export type PaatosStatus = 'accepted' | 'accepted_with_changes' | 'rejected'

export interface PaatosValues {
  status: PaatosStatus
}

export interface Answers {
    projectName: string
    contactPersonName: string
    contactPersonEmail: string
    contactPersonPhoneNumber: string
    lang?: 'fi' | 'sv'
}

export interface VaCodeValues {
  operationalUnit: string
  project: string
  operation: string
}
