import { FormikProps } from 'formik'
import { EnvironmentApiResponse } from './environment'
import { Avustushaku, NormalizedHakemusData } from '../types'
import { Role } from '../../../../va-virkailija/web/va/types'
import * as yup from 'yup'
import { Language, translations } from 'soresu-form/web/va/i18n/translations'

export type MuutoshakemusProps = {
  status: 'LOADED' | 'LOADING'
  avustushaku?: Avustushaku
  environment?: EnvironmentApiResponse
  hakemus?: NormalizedHakemusData
  muutoshakemukset: Muutoshakemus[]
}

export interface MuutoshakemusPaatosResponse {
  hakemus: NormalizedHakemusData
  muutoshakemus: Muutoshakemus
  muutoshakemusUrl: string
  muutoshakemukset: Muutoshakemus[]
  avustushaku: Avustushaku
  paatos: Paatos
  isDecidedByUkotettuValmistelija: boolean
  presenter: Role
}

export interface PaatosState extends MuutoshakemusPaatosResponse {
  environment: EnvironmentApiResponse
}

const PAATOS_ACCEPTED = 'accepted'
const PAATOS_ACCEPTED_WITH_CHANGES = 'accepted_with_changes'
const PAATOS_REJECTED = 'rejected'

export const PAATOS_STATUSES = [
  PAATOS_ACCEPTED,
  PAATOS_ACCEPTED_WITH_CHANGES,
  PAATOS_REJECTED,
] as const
export type PaatosStatus = (typeof PAATOS_STATUSES)[number]

export const MuutoshakemusStatuses = [...PAATOS_STATUSES, 'new'] as const
export type MuutoshakemusStatus = (typeof MuutoshakemusStatuses)[number]

export interface Muutoshakemus {
  id: number
  status?: MuutoshakemusStatus
  'hakemus-id': number
  'haen-kayttoajan-pidennysta': boolean
  'kayttoajan-pidennys-perustelut'?: string
  'haen-sisaltomuutosta': boolean
  'sisaltomuutos-perustelut'?: string
  'talousarvio-perustelut'?: string
  talousarvio: Talousarvio
  'haettu-kayttoajan-paattymispaiva'?: string
  'created-at': string
  'paatos-created-at'?: string
  'paatos-sent-at'?: string
  'paatos-user-key'?: string
  'paatos-hyvaksytty-paattymispaiva'?: string
  'paatos-status-jatkoaika': PaatosStatus | null
  'paatos-talousarvio'?: Talousarvio
  'paatos-status-talousarvio': PaatosStatus | null
  'paatos-status-sisaltomuutos': PaatosStatus | null
  'paatos-reason'?: string
}

export interface Paatos {
  id: number
  status?: MuutoshakemusStatus
  decider: string
  reason: string
  talousarvio?: Talousarvio
  paattymispaiva?: string
  'user-key': string
  'created-at': string
  'updated-at': string
  'paatos-status-jatkoaika'?: PaatosStatus
  'paatos-status-talousarvio'?: PaatosStatus
  'paatos-status-sisaltomuutos'?: PaatosStatus
}

export interface Meno {
  type: string
  'translation-fi': string
  'translation-sv': string
  amount: number
}
export type Talousarvio = Meno[]

export type TalousarvioValues = {
  [key: string]: number
  originalSum: number
  currentSum: number
}

export const getTalousarvioSchema = (talousarvio: TalousarvioValues, e: any) => {
  const menos = Object.keys(talousarvio).reduce((acc, key) => {
    if (key !== 'originalSum' && key !== 'currentSum') {
      return { ...acc, [key]: yup.number().min(0).required(e.required) }
    } else {
      return acc
    }
  }, {})

  return {
    ...menos,
    originalSum: yup.number().required(e.required),
    currentSum: yup
      .number()
      .test(
        'current-sum',
        e.talousarvioSum(talousarvio.originalSum),
        (s) => s === talousarvio.originalSum
      )
      .required(e.required),
  }
}

export const getMuutoshakemusSchema = (lang: Language) => {
  const t = translations[lang]
  const e = t.formErrors
  return yup
    .object({
      name: yup.string().required(e.required),
      email: yup.string().email(e.email).required(e.required),
      phone: yup.string().required(e.required),
      hasTrustedContact: yup.boolean().required(),
      trustedContactName: yup.string().when('hasTrustedContact', {
        is: true,
        then: (schema) => schema.required(e.required),
        otherwise: (schema) => schema.notRequired(),
      }),
      trustedContactEmail: yup.string().when('hasTrustedContact', {
        is: true,
        then: (schema) => schema.email(e.email).required(e.required),
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
}

export type FormValues = yup.InferType<ReturnType<typeof getMuutoshakemusSchema>>

export type FormikHook = FormikProps<FormValues>
