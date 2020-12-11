import * as yup from 'yup'
import { useFormik } from 'formik'

import { FormValues } from './types'
import { postMuutoshakemus } from './client'

const MuutoshakemusSchema = yup.object().shape<FormValues>({
  name: yup.string().required(),
  email: yup.string().matches(/^[a-zA-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/).required(),
  phone: yup.string().required(),
  haenKayttoajanPidennysta: yup.boolean().nullable(false).required(),
  haettuKayttoajanPaattymispaiva: yup.date().when('haenKayttoajanPidennysta', {
    is: true,
    then: yup.date().required(),
    otherwise: yup.date()
  }),
  kayttoajanPidennysPerustelut: yup.string().when('haenKayttoajanPidennysta', {
    is: true,
    then: yup.string().required(),
    otherwise: yup.string()
  })
}).required()

const initialValues: FormValues = {
  name: '',
  email: '',
  phone: '',
  haenKayttoajanPidennysta: false,
  haettuKayttoajanPaattymispaiva: new Date(),
  kayttoajanPidennysPerustelut: ''
}

export const createFormikHook = (userKey: string) => useFormik({
  initialValues,
  validationSchema: MuutoshakemusSchema,
  onSubmit: async (values, formik) => {
    try {
      formik.setStatus({})
      await postMuutoshakemus({ userKey, values })
      formik.resetForm({ values })
      formik.setStatus({ success: true })
      formik.setSubmitting(false)
    } catch (e) {
      formik.setStatus({ success: false })
    }
    formik.setSubmitting(false)
  }
})
