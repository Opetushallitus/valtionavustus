import { FormikProps } from "formik"

import { FormValues } from "./types"

export const getInputErrorClass = (f: FormikProps<FormValues>, valueName: keyof FormValues): string => {
  return (f.errors[valueName])
    ? 'muutoshakemus__input-error'
    : ''
}
