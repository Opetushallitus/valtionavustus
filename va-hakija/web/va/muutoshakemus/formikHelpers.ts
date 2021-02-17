import { FormikProps } from "formik"

import { FormValues } from "../../../../va-common/web/va/types/muutoshakemus"

export const getInputErrorClass = (f: FormikProps<FormValues>, valueName: keyof FormValues): string => {
  return (f.errors[valueName])
    ? 'muutoshakemus__input-error'
    : ''
}
