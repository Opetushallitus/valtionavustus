import * as yup from 'yup'
import { useFormik } from 'formik'

import { FormValues } from '../../../../va-common/web/va/types/muutoshakemus'
import { postMuutoshakemus } from './client'
import { Language, translations } from './translations'

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
    }),
    haenMuutostaTaloudenKayttosuunnitelmaan: yup.boolean().required(e.required),
    taloudenKayttosuunnitelmanPerustelut: yup.string().when('haenMuutostaTaloudenKayttosuunnitelmaan', {
      is: true,
      then: yup.string().required(e.required),
      otherwise: yup.string()
    }),
    talousarvio: yup.object().when('haenMuutostaTaloudenKayttosuunnitelmaan', {
      is: true,
      then: yup.lazy((talousarvio: object) => yup.object(Object.keys(talousarvio).reduce((acc, key) => ({ ...acc, [key]: yup.number().required(e.required) }), {}))),
      otherwise: yup.object()
    })
  }).required()
}

const initialValues: FormValues = {
  name: '',
  email: '',
  phone: '',
  haenKayttoajanPidennysta: false,
  haettuKayttoajanPaattymispaiva: new Date(),
  kayttoajanPidennysPerustelut: '',
  haenMuutostaTaloudenKayttosuunnitelmaan: false,
  taloudenKayttosuunnitelmanPerustelut: '',
  talousarvio: {}
}

export const createFormikHook = (userKey: string, lang: Language) => useFormik({
  initialValues,
  validationSchema: getMuutoshakemusSchema(lang),
  onSubmit: async (values, formik) => {
    try {
      formik.setStatus({ success: undefined })
      await postMuutoshakemus({ userKey, values })
      formik.resetForm({ values })
      formik.setStatus({ success: true })
    } catch (e) {
      formik.setStatus({ success: false })
    }
    formik.setSubmitting(false)
  }
})
