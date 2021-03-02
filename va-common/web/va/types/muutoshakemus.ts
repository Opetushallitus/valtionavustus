import { FormikProps } from 'formik'

export type EnvironmentApiResponse = {
  name: string
  'hakija-server': {
    url: {
      fi: string,
      sv: string
    }
  }
}

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

export interface Avustushaku {
  "hankkeen-alkamispaiva"?: string
  "hankkeen-paattymispaiva"?: string
}

export interface Presenter {
  name: string
  email: string
}

export interface Muutoshakemus {
  id: number
  status: "new" | "accepted" | "rejected" | "accepted_with_changes"
  "hakemus-id": number
  "haen-kayttoajan-pidennysta": boolean
  "kayttoajan-pidennys-perustelut"?: string
  "haettu-kayttoajan-paattymispaiva"?: string
  "created-at": string
  "paatos-created-at"?: string
  "paatos-sent-at"?: string
  "paatos-user-key"?: string
  "paatos-hyvaksytty-paattymispaiva"?: string
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

export interface NormalizedHakemus {
  id: number
  "hakemus-id": number
  "project-name": string
  "contact-person": string
  "contact-email": string
  "contact-phone": string
  "organization-name": string
  "register-number": string
  "project-end": string
  "created-at": string
  "updated-at": string
}

export type FormValues = {
  name: string
  email: string
  phone: string
  haenKayttoajanPidennysta: boolean
  haettuKayttoajanPaattymispaiva?: Date,
  kayttoajanPidennysPerustelut?: string
}

export type FormikHook = FormikProps<FormValues>
