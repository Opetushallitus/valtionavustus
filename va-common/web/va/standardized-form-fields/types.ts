import * as yup from 'yup'

export interface StandardizedFormValues {
  "help-text-fi": string 
  "help-text-sv": string
}

export type Language = 'fi' | 'sv'

export const standardizedFormValuesSchema = yup.object().shape<StandardizedFormValues>({
    "help-text-fi": yup.string(),
    "help-text-sv": yup.string()
}).required()

