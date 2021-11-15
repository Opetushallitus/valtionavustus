import {
  Meno,
  TalousarvioValues
} from "../../../../va-common/web/va/types/muutoshakemus";
import {FormikProps} from "formik";

const PAATOS_ACCEPTED = 'accepted'
const PAATOS_ACCEPTED_WITH_CHANGES = 'accepted_with_changes'
const PAATOS_REJECTED = 'rejected'

const PAATOS_STATUSES = [PAATOS_ACCEPTED, PAATOS_ACCEPTED_WITH_CHANGES, PAATOS_REJECTED] as const

export type PaatosStatus = typeof PAATOS_STATUSES[number]

export interface MuutoshakemusPaatosResponse {
  id: number
  status?: PaatosStatus
  'user-key': string
  reason: string
  decider: string
  muutoshakemusUrl: string
  'status-sisaltomuutos'?: PaatosStatus
  'hyvaksytyt-sisaltomuutokset'?: string
  'status-jatkoaika'?: PaatosStatus
  'paatos-hyvaksytty-paattymispaiva'?: string
  'status-talousarvio'?: PaatosStatus
  'talousarvio': Meno[]
}

export interface MuutoshakemusPaatos extends MuutoshakemusPaatosResponse {
  muutoshakemusId: number
  hakemusId: number
}

export interface MuutoshakemusPaatosRequest {
  'haen-kayttoajan-pidennysta'?: {
    status: PaatosStatus
    paattymispaiva?: string
  }
  'haen-sisaltomuutosta'?: {
    status: PaatosStatus
    'hyvaksytyt-sisaltomuutokset'?: string
  }
  talousarvio?: {
    status: PaatosStatus
    talousarvio?: TalousarvioValues
  }
  reason: string
}

export type MuutoshakemusPaatosFormValues = FormikProps<MuutoshakemusPaatosRequest>
