import * as yup from 'yup'
import { useFormik } from 'formik'

import { FormValues, TalousarvioValues } from 'soresu-form/web/va/types/muutoshakemus'
import { getTalousarvioSchema } from 'soresu-form/web/va/Muutoshakemus'
import { postMuutoshakemus } from './client'
import { Language, translations } from 'soresu-form/web/va/i18n/translations'
import { ObjectSchema } from 'yup'

const emailRegex =
  /^[a-zA-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
const getMuutoshakemusSchema = (lang: Language) => {
  const t = translations[lang]
  const e = t.formErrors
  const schema: ObjectSchema<FormValues> = yup
    .object({
      name: yup.string().required(e.required),
      email: yup.string().matches(emailRegex, e.email).required(e.required),
      phone: yup.string().required(e.required),
      hasTrustedContact: yup.boolean().required(),
      trustedContactName: yup.string().when('hasTrustedContact', {
        is: true,
        then: (schema) => schema.required(e.required),
        otherwise: (schema) => schema.notRequired(),
      }),
      trustedContactEmail: yup.string().when('hasTrustedContact', {
        is: true,
        then: (schema) => schema.matches(emailRegex).required(e.required),
        otherwise: (schema) => schema.notRequired(),
      }),
      trustedContactPhone: yup.string().when('hasTrustedContact', {
        is: true,
        then: (schema) => schema.required(e.required),
        otherwise: (schema) => schema.notRequired(),
      }),
      haenKayttoajanPidennysta: yup.boolean().required(e.required),
      haettuKayttoajanPaattymispaiva: yup.date().when('haenKayttoajanPidennysta', {
        is: true,
        then: (schema) =>
          schema.min(new Date(), e.haettuKayttoajanPaattymispaiva).required(e.required),
        otherwise: (schema) => schema,
      }),
      kayttoajanPidennysPerustelut: yup.string().when('haenKayttoajanPidennysta', {
        is: true,
        then: (schema) => schema.required(e.required),
        otherwise: (schema) => schema,
      }),
      haenSisaltomuutosta: yup.boolean().required(e.required),
      sisaltomuutosPerustelut: yup.string().when('haenSisaltomuutosta', {
        is: true,
        then: (schema) => schema.required(e.required),
        otherwise: (schema) => schema,
      }),
      taloudenKayttosuunnitelmanPerustelut: yup
        .string()
        .when('haenMuutostaTaloudenKayttosuunnitelmaan', {
          is: true,
          then: (schema) => schema.required(e.required),
          otherwise: (schema) => schema,
        }),
      haenMuutostaTaloudenKayttosuunnitelmaan: yup.boolean().required(e.required),
      talousarvio: yup
        .mixed()
        .when(['haenMuutostaTaloudenKayttosuunnitelmaan'], ([shouldValidate], _schema) => {
          return shouldValidate
            ? yup.lazy((val) => yup.object(getTalousarvioSchema(val, e)).required(e.required))
            : yup.object()
        }) as yup.Schema<TalousarvioValues | undefined>,
    })
    .required()
  return schema
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
