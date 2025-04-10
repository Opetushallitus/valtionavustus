import * as yup from 'yup'
import { useFormik } from 'formik'

import { FormValues, TalousarvioValues } from 'soresu-form/web/va/types/muutoshakemus'
import { getTalousarvioSchema } from 'soresu-form/web/va/Muutoshakemus'
import { postMuutoshakemus } from './client'
import { Language } from 'soresu-form/web/va/i18n/translations'

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
