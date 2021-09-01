import {FormikProps} from "formik"

import { FormValues } from "va-common/web/va/types/muutoshakemus"

export const getInputErrorClass = (f: FormikProps<FormValues>, valueName: keyof FormValues): string => {
  return (f.errors[valueName])
    ? 'muutoshakemus__input-error'
    : ''
}

export const getNestedInputErrorClass = <F extends FormikProps<any>>(f: F, nestedName: string[]): string => {
  const hasError = nestedName.reduce((acc, name) => acc ? (acc[name] as any) : undefined, f.errors)
  return hasError
    ? 'muutoshakemus__input-error'
    : ''
}
