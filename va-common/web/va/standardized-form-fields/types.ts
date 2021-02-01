import { FormikProps } from 'formik'

export interface StandardizedFormValues {
  "help-text-fi": string 
  "help-text-sv": string
}

export type FormikHook = FormikProps<StandardizedFormValues>

export type StandardizedFieldsState = {
  status: 'LOADED' | 'LOADING'
  values?: StandardizedFormValues
}
export type Language = 'fi' | 'sv'
