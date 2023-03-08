import { FormikProps } from 'formik'

import { FormValues } from 'soresu-form/web/va/types/muutoshakemus'

export const getInputErrorClass = (
  f: FormikProps<FormValues>,
  valueName: keyof FormValues,
  defaultClass = '',
  errorClass = 'muutoshakemus__input-error'
): string => {
  return f.errors[valueName] ? errorClass : defaultClass
}

export const getNestedInputErrorClass = <F extends FormikProps<any>>(
  f: F,
  nestedName: string[]
): string => {
  const hasError = getNestedFormikError(f, nestedName)
  return hasError ? 'muutoshakemus__input-error' : ''
}

export const getNestedFormikError = <F extends FormikProps<any>>(
  f: F,
  nestedName: string[]
): boolean => !!nestedName.reduce((acc, name) => (acc ? (acc[name] as any) : undefined), f.errors)
