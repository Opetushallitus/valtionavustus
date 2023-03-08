import { FormikProps } from 'formik'

export const isSubmitDisabled = <T extends FormikProps<any>>(formik: T) =>
  formik.isSubmitting || formik.isValidating || !(formik.isValid && formik.dirty)

export const isError = <T extends FormikProps<any>>(formik: T, name: string): boolean =>
  !!(formik.errors[name] && formik.touched[name])
