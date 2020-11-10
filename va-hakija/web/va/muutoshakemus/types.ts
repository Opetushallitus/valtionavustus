import * as yup from 'yup'
import { translationsFi } from './translations'

export type Language = 'fi' | 'sv'
export type Translations = typeof translationsFi

export interface Hakemus {
  "id": number
  "hakemus-id": number
  "user-key": string
  "project-name": string
  "contact-person": string
  "contact-email": string
  "contact-phone": string
}
export const hakemusSchema = yup.object().shape<Hakemus>({
  "id": yup.number().required(),
  "hakemus-id": yup.number().required(),
  "user-key": yup.string().required(),
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

