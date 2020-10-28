import * as yup from 'yup'
import { translationsFi } from './translations'

export type Language = 'fi' | 'sv'
export type Translations = typeof translationsFi

export interface Hakemus {
  "user-key": string
  "project-name": string
  "contact-person": string
  "contact-email": string
  "contact-phone": string
}
export const hakemusSchema = yup.object().shape<Hakemus>({
  "user-key": yup.string().required(),
  "project-name": yup.string().required(),
  "contact-person": yup.string().required(),
  "contact-email": yup.string().required(),
  "contact-phone": yup.string().required()
}).required()

