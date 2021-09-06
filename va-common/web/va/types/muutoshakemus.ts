import { FormikProps } from 'formik'
import { EnvironmentApiResponse } from './environment'
import {Avustushaku, NormalizedHakemusData} from '../types'

export type MuutoshakemusProps = {
  status: 'LOADED' | 'LOADING'
  avustushaku?: any
  environment?: EnvironmentApiResponse
  hakemus?: NormalizedHakemusData
  muutoshakemukset: Muutoshakemus[]
}

export type PaatosState = {
  hakemus: NormalizedHakemusData
  muutoshakemus: Muutoshakemus
  muutoshakemukset: Muutoshakemus[]
  avustushaku: Avustushaku
  paatos: Paatos
  isPresentingOfficer: boolean
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
  talousarvio?: Talousarvio
  paattymispaiva?: string
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
