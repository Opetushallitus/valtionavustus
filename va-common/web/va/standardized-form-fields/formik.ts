import * as yup from 'yup'
import { useFormik } from 'formik'
import { StandardizedFormValues } from './types'
import { postStandardizedFields } from './client'

export const initialValues: StandardizedFormValues = {
  "help-text-fi": '',
  "help-text-sv": ''
}

export const standardizedFormValuesSchema = yup.object().shape<StandardizedFormValues>({
    "help-text-fi": yup.string(),
    "help-text-sv": yup.string()
}).required()

export const createFormikHook = (avustushakuId: number) => useFormik({
    initialValues,
    validationSchema: standardizedFormValuesSchema,
    onSubmit: async (values, formik) => {
      try {
        formik.setStatus({ success: undefined })
        await postStandardizedFields(avustushakuId, values )
        formik.resetForm({ values })
        formik.setStatus({ success: true })
      } catch (e) {
        formik.setStatus({ success: false })
      }
      formik.setSubmitting(false)
    }
  })

