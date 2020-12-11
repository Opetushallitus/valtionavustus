import * as yup from 'yup'
import { useFormik } from 'formik'

import { FormValues, Language } from './types'
import { postMuutoshakemus } from './client'
import { translations } from './translations'

const getMuutoshakemusSchema = (lang: Language) => {
  const t = translations[lang]
  const e = t.formErrors
  return yup.object().shape<FormValues>({
    name: yup.string().required(e.required),
    email: yup
      .string()
      .matches(/^[a-zA-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/, e.email)
      .required(e.required),
    phone: yup.string().required(e.required),
    haenKayttoajanPidennysta: yup.boolean().required(e.required),
    haettuKayttoajanPaattymispaiva: yup.date().when('haenKayttoajanPidennysta', {
      is: true,
      then: yup.date()
        .min(new Date(), e.haettuKayttoajanPaattymispaiva)
        .required(e.required),
      otherwise: yup.date()
    }),
    kayttoajanPidennysPerustelut: yup.string().when('haenKayttoajanPidennysta', {
      is: true,
      then: yup.string().required(e.required),
      otherwise: yup.string()
    })
  }).required()
}

const initialValues: FormValues = {
  name: '',
  email: '',
  phone: '',
  haenKayttoajanPidennysta: false,
  haettuKayttoajanPaattymispaiva: new Date(),
  kayttoajanPidennysPerustelut: ''
}

export const createFormikHook = (userKey: string, lang: Language) => useFormik({
  initialValues,
  validationSchema: getMuutoshakemusSchema(lang),
  onSubmit: async (values, formik) => {
    try {
      formik.setStatus({})
      await postMuutoshakemus({ userKey, values })
      formik.resetForm({ values })
      formik.setStatus({ success: true })
    } catch (e) {
      formik.setStatus({ success: false })
    }
    formik.setSubmitting(false)
  }
})
