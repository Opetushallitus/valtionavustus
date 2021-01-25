import { FormikProps } from 'formik'

interface StandardizedFormValuesPerLanguage {
  helpText: string
}
export interface StandardizedFormValues {
  fi: StandardizedFormValuesPerLanguage
  sv: StandardizedFormValuesPerLanguage
}

export type FormikHook = FormikProps<StandardizedFormValues>
