import { FormikProps } from 'formik'

interface StandardizedFormValuesPerLanguage {
  helpText: string
}
export interface StandardizedFormValues {
  fi: StandardizedFormValuesPerLanguage
  sv: StandardizedFormValuesPerLanguage
}

export type FormikHook = FormikProps<StandardizedFormValues>

export type StandardizedFieldsState = {
  status: 'LOADED' | 'LOADING'
  helpText?: string
}
export type Language = 'fi' | 'sv'
