import * as yup from 'yup'

export interface StandardizedFormHelpTexts {
  "ohjeteksti-fi": string 
  "ohjeteksti-sv": string
  "hakija-name-fi": string
  "hakija-name-sv": string
  "hakija-email-fi": string
  "hakija-email-sv": string
}

export type Language = 'fi' | 'sv'

export const standardizedFormHelpTextsSchema = yup.object().shape<StandardizedFormHelpTexts>({
    "ohjeteksti-fi": yup.string(),
    "ohjeteksti-sv": yup.string(),
    "hakija-name-fi": yup.string(),
    "hakija-name-sv": yup.string(),
    "hakija-email-fi": yup.string(),
    "hakija-email-sv": yup.string(),
}).required()

