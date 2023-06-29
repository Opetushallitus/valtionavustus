import { FormikProps } from 'formik'
import { EnvironmentApiResponse } from './environment'
import { Avustushaku, NormalizedHakemusData } from '../types'
import { Role } from '../../../../va-virkailija/web/va/types'

export type MuutoshakemusProps = {
  status: 'LOADED' | 'LOADING'
  avustushaku?: Avustushaku
  environment?: EnvironmentApiResponse
  hakemus?: NormalizedHakemusData
  muutoshakemukset: Muutoshakemus[]
}

export interface MuutoshakemusPaatosResponse {
  hakemus: NormalizedHakemusData
  muutoshakemus: Muutoshakemus
  muutoshakemusUrl: string
  muutoshakemukset: Muutoshakemus[]
  avustushaku: Avustushaku
  paatos: Paatos
  isDecidedByUkotettuValmistelija: boolean
  presenter: Role
}

export interface PaatosState extends MuutoshakemusPaatosResponse {
  environment: EnvironmentApiResponse
}

const PAATOS_ACCEPTED = 'accepted'
const PAATOS_ACCEPTED_WITH_CHANGES = 'accepted_with_changes'
const PAATOS_REJECTED = 'rejected'

const PAATOS_STATUSES = [PAATOS_ACCEPTED, PAATOS_ACCEPTED_WITH_CHANGES, PAATOS_REJECTED] as const
export type PaatosStatus = (typeof PAATOS_STATUSES)[number]

export const MuutoshakemusStatuses = [...PAATOS_STATUSES, 'new'] as const
export type MuutoshakemusStatus = (typeof MuutoshakemusStatuses)[number]

export interface Muutoshakemus {
  id: number
  status?: MuutoshakemusStatus
  'hakemus-id': number
  'haen-kayttoajan-pidennysta': boolean
  'kayttoajan-pidennys-perustelut'?: string
  'haen-sisaltomuutosta': boolean
  'sisaltomuutos-perustelut'?: string
  'talousarvio-perustelut'?: string
  talousarvio: Talousarvio
  'haettu-kayttoajan-paattymispaiva'?: string
  'created-at': string
  'paatos-created-at'?: string
  'paatos-sent-at'?: string
  'paatos-user-key'?: string
  'paatos-hyvaksytty-paattymispaiva'?: string
  'paatos-status-jatkoaika': PaatosStatus | null
  'paatos-talousarvio'?: Talousarvio
  'paatos-status-talousarvio': PaatosStatus | null
  'paatos-status-sisaltomuutos': PaatosStatus | null
  'paatos-reason'?: string
}

export interface Paatos {
  id: number
  status?: MuutoshakemusStatus
  decider: string
  reason: string
  talousarvio?: Talousarvio
  paattymispaiva?: string
  'user-key': string
  'created-at': string
  'updated-at': string
  'paatos-status-jatkoaika'?: PaatosStatus
  'paatos-status-talousarvio'?: PaatosStatus
  'paatos-status-sisaltomuutos'?: PaatosStatus
}

export interface Meno {
  type: string
  'translation-fi': string
  'translation-sv': string
  amount: number
}
export type Talousarvio = Meno[]

export type TalousarvioValues = {
  [key: string]: number
  originalSum: number
  currentSum: number
}

export type FormValues = {
  name: string
  email: string
  phone: string
  hasTrustedContact: boolean
  trustedContactName?: string
  trustedContactEmail?: string
  trustedContactPhone?: string
  haenKayttoajanPidennysta: boolean
  haenSisaltomuutosta: boolean
  sisaltomuutosPerustelut?: string
  haenMuutostaTaloudenKayttosuunnitelmaan: boolean
  haettuKayttoajanPaattymispaiva?: Date
  kayttoajanPidennysPerustelut?: string
  taloudenKayttosuunnitelmanPerustelut?: string
  talousarvio?: TalousarvioValues
}

export type FormikHook = FormikProps<FormValues>
