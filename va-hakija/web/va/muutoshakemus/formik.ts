import * as yup from 'yup'
import { useFormik } from 'formik'

import { FormValues, TalousarvioValues } from 'soresu-form/web/va/types/muutoshakemus'
import { getTalousarvioSchema } from 'soresu-form/web/va/Muutoshakemus'
import { postMuutoshakemus } from './client'
import { Language, translations } from 'soresu-form/web/va/i18n/translations'

const emailRegex =
  /^[a-zA-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
const getMuutoshakemusSchema = (lang: Language) => {
  const t = translations[lang]
  const e = t.formErrors
  return yup
    .object()
    .shape<FormValues>({
      name: yup.string().required(e.required),
      email: yup.string().matches(emailRegex, e.email).required(e.required),
      phone: yup.string().required(e.required),
      hasTrustedContact: yup.boolean(),
      trustedContactName: yup.string().when('hasTrustedContact', {
        is: true,
        then: yup.string().required(e.required),
        otherwise: yup.string().notRequired(),
      }),
      trustedContactEmail: yup.string().when('hasTrustedContact', {
        is: true,
        then: yup.string().matches(emailRegex).required(e.required),
        otherwise: yup.string().notRequired(),
      }),
      trustedContactPhone: yup.string().when('hasTrustedContact', {
        is: true,
        then: yup.string().required(e.required),
        otherwise: yup.string().notRequired(),
      }),
      haenKayttoajanPidennysta: yup.boolean().required(e.required),
      haettuKayttoajanPaattymispaiva: yup.date().when('haenKayttoajanPidennysta', {
        is: true,
        then: yup.date().min(new Date(), e.haettuKayttoajanPaattymispaiva).required(e.required),
        otherwise: yup.date(),
      }),
      kayttoajanPidennysPerustelut: yup.string().when('haenKayttoajanPidennysta', {
        is: true,
        then: yup.string().required(e.required),
        otherwise: yup.string(),
      }),
      haenMuutostaTaloudenKayttosuunnitelmaan: yup.boolean().required(e.required),
      haenSisaltomuutosta: yup.boolean().required(e.required),
      sisaltomuutosPerustelut: yup.string().when('haenSisaltomuutosta', {
        is: true,
        then: yup.string().required(e.required),
        otherwise: yup.string(),
      }),
      taloudenKayttosuunnitelmanPerustelut: yup
        .string()
        .when('haenMuutostaTaloudenKayttosuunnitelmaan', {
          is: true,
          then: yup.string().required(e.required),
          otherwise: yup.string(),
        }),
      talousarvio: yup.object<TalousarvioValues>().when('haenMuutostaTaloudenKayttosuunnitelmaan', {
        is: true,
        then: yup.lazy((talousarvio: TalousarvioValues) =>
          yup.object<TalousarvioValues>(getTalousarvioSchema(talousarvio, e)).required()
        ),
        otherwise: yup.object(),
      }),
    })
    .required()
}

const initialValues: FormValues = {
  name: '',
  email: '',
  phone: '',
  hasTrustedContact: false,
  trustedContactName: '',
  trustedContactEmail: '',
  trustedContactPhone: '',
  haenKayttoajanPidennysta: false,
  haenSisaltomuutosta: false,
  haettuKayttoajanPaattymispaiva: new Date(),
  kayttoajanPidennysPerustelut: '',
  haenMuutostaTaloudenKayttosuunnitelmaan: false,
  taloudenKayttosuunnitelmanPerustelut: '',
  sisaltomuutosPerustelut: '',
  talousarvio: {
    originalSum: 0,
    currentSum: 0,
  },
}

export const createFormikHook = (userKey: string, lang: Language) =>
  useFormik({
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
    },
  })
