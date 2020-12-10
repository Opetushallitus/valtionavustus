import * as yup from 'yup'
import { translationsFi } from './translations'

export type Language = 'fi' | 'sv'
export type Translations = typeof translationsFi

export type PaatosState = {
  hakemus: NormalizedHakemus
  muutoshakemus: Muutoshakemus
  paatos: Paatos
  presenter: Presenter
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

export interface NormalizedHakemus extends Hakemus {
  "organization-name": string
  "register-number": string
  "project-end": string
  "created-at": string
  "updated-at": string
}


export interface Hakemus {
  id: number
  "hakemus-id": number
  "project-name": string
  "contact-person": string
  "contact-email": string
  "contact-phone": string
}

export const hakemusSchema = yup.object().shape<Hakemus>({
  "id": yup.number().required(),
  "hakemus-id": yup.number().required(),
  "project-name": yup.string().required(),
  "contact-person": yup.string().required(),
  "contact-email": yup.string().required(),
  "contact-phone": yup.string().required()
}).required()

export class EmailValidationError extends Error {
  constructor(message: string) {
    super()
    this.name = 'EmailValidationError'
    this.message = message
  }
}

