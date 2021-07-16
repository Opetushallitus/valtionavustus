import { FormikProps } from 'formik'
import { EnvironmentApiResponse } from './environment'
import { Avustushaku } from '../types'

export type MuutoshakemusProps = {
  status: 'LOADED' | 'LOADING'
  avustushaku?: any
  environment?: EnvironmentApiResponse
  hakemus?: NormalizedHakemus
  muutoshakemukset: Muutoshakemus[]
}

export type PaatosState = {
  hakemus: NormalizedHakemus
  muutoshakemus: Muutoshakemus
  muutoshakemukset: Muutoshakemus[]
  avustushaku: Avustushaku
  paatos: Paatos
  presenter: Presenter
}

export interface Presenter {
  name: string
  email: string
}

export type MuutoshakemusStatus = "new" | "accepted" | "rejected" | "accepted_with_changes"

export interface Muutoshakemus {
  id: number
  status: MuutoshakemusStatus
  "hakemus-id": number
  "haen-kayttoajan-pidennysta": boolean
  "kayttoajan-pidennys-perustelut"?: string
  "haen-sisaltomuutosta": boolean
  "sisaltomuutos-perustelut"?: string
  "talousarvio-perustelut"?: string
  talousarvio: Talousarvio
  "haettu-kayttoajan-paattymispaiva"?: string
  "created-at": string
  "paatos-created-at"?: string
  "paatos-sent-at"?: string
  "paatos-user-key"?: string
  "paatos-hyvaksytty-paattymispaiva"?: string
  "paatos-talousarvio"?: Talousarvio
  "paatos-hyvaksytty-sisaltomuutos"?: string
}

export interface Paatos {
  id: number
  status: "accepted" | "rejected" | "accepted_with_changes"
  decider: string
  reason: string
  "user-key": string
  "created-at": string
  "updated-at": string
}

export interface Meno {
  type: string
  "translation-fi": string
  "translation-sv": string
  amount: number
}
export type Talousarvio = Meno[]

export interface NormalizedHakemus {
  id: number
  "hakemus-id": number
  "project-name": string
  "contact-person": string
  "contact-email": string
  "contact-phone": string
  "organization-name": string
  "register-number": string
  "created-at": string
  "updated-at": string
  talousarvio: Talousarvio
}

export type TalousarvioValues = {
  [key: string]: number
  originalSum: number
  currentSum: number
}

export type FormValues = {
  name: string
  email: string
  phone: string
  haenKayttoajanPidennysta: boolean
  haenSisaltomuutosta: boolean
  sisaltomuutosPerustelut?: string
  haenMuutostaTaloudenKayttosuunnitelmaan: boolean
  haettuKayttoajanPaattymispaiva?: Date,
  kayttoajanPidennysPerustelut?: string
  taloudenKayttosuunnitelmanPerustelut?: string
  talousarvio?: TalousarvioValues
}

export type FormikHook = FormikProps<FormValues>
