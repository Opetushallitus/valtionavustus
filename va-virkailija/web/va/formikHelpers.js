export const isSubmitDisabled = formik => formik.isSubmitting || formik.isValidating || !(formik.isValid && formik.dirty)

export const isError = (formik, name) => formik.errors[name] && formik.touched[name]
