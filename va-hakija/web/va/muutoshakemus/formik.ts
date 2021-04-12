import * as yup from 'yup'
import { useFormik } from 'formik'

import { FormValues, Meno, TalousarvioValues } from '../../../../va-common/web/va/types/muutoshakemus'
import { postMuutoshakemus } from './client'
import { FormErrors, Language, translations } from './translations'

export const getTalousarvioValues = (talousarvio: Meno[]): TalousarvioValues => {
  const menos = talousarvio.reduce((acc: object, meno: Meno) => ({ ...acc, [meno.type]: meno.amount }), {})
  const sum = talousarvio.reduce((acc: number, meno: Meno) => acc + meno.amount, 0)
  return {
    ...menos,
    originalSum: sum,
    currentSum: sum
  }
}

const getTalousarvioSchema = (talousarvio: TalousarvioValues, e: FormErrors) => {
  const menos = Object.keys(talousarvio).reduce((acc, key) => {
    if (key !== 'originalSum' && key !== 'currentSum') {
      return ({ ...acc, [key]: yup.number().required(e.required) })
    } else {
      return acc
    }
  }, {})

  return {
    ...menos,
    originalSum: yup.number().required(e.required),
    currentSum: yup.number().test('current-sum', e.talousarvioSum(talousarvio.originalSum), s => s === talousarvio.originalSum).required(e.required)
  }
}

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
    talousarvio: yup.object<TalousarvioValues>().when('haenMuutostaTaloudenKayttosuunnitelmaan', {
      is: true,
      then: yup.lazy((talousarvio: TalousarvioValues) => yup.object<TalousarvioValues>(getTalousarvioSchema(talousarvio, e)).required()),
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
  talousarvio: {
    originalSum: 0,
    currentSum: 0
  }
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
