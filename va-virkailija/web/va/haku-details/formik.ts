import * as yup from 'yup'
import { useFormik } from 'formik'
import { StandardizedFormValues } from './types'

const initialValues: StandardizedFormValues = {
  fi: {
    helpText: ''
  },
  sv: {
    helpText: ''
  }
}

export const standardizedFormValuesSchema = yup.object().shape<StandardizedFormValues>({
  fi: yup.object({
    helpText: yup.string()
  }).required(),
  sv: yup.object({
    helpText: yup.string()
  }).required()
}).required()

export async function postStandardizedFields(_props: StandardizedFormValues) {
}

export const createFormikHook = () => useFormik({
    initialValues,
    validationSchema: standardizedFormValuesSchema,
    onSubmit: async (values, formik) => {
      try {
        formik.setStatus({ success: undefined })
        await postStandardizedFields( values )
        formik.resetForm({ values })
        formik.setStatus({ success: true })
      } catch (e) {
        formik.setStatus({ success: false })
      }
      formik.setSubmitting(false)
    }
  })

