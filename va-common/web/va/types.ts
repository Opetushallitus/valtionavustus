import { Muutoshakemus, MuutoshakemusStatus, Talousarvio } from "./types/muutoshakemus"

export type Language = 'fi' | 'sv'

export type HakemusFormState = {
  avustushaku: any
  form: any
  configuration: any
  answersDelta: AnswersDelta
  saveStatus: any
  changeRequests: any
  attachmentVersions: any
  extensionApi: any
}

export type AnswersDelta = {
  changedAnswers: Answer[]
  newAnswers: Answer[]
  attachmentVersionsByFieldId?: _.Dictionary<any[]>
}

export type Answer = {
  fieldType?: string
  key: string
  value: any
  attachmentVersion?: any
}

type Arvio = {
  "budget-granted"?: number
  costsGranted?: number
  "overridden-answers"?: {
    value: Answer[]
  }
}

export interface NormalizedHakemusData {
  "contact-person": string
  "contact-email": string
  "contact-phone": string
  "hakemus-id": number
  id: number
  "organization-name": string
  "project-name": string
  "register-number": string
  talousarvio?: Talousarvio
  "created-at": string
  "updated-at": string
}

export type HakemusStatus = 'new' | 'draft' | 'submitted' | 'pending_change_request' | 'officer_edit' | 'cancelled' | 'refused' | 'applicant_edit'

export type Hakemus = {
  id: number
  answers: Answer[]
  arvio: Arvio
  status: HakemusStatus
  'status-comment'?: unknown
  'status-loppuselvitys'?: unknown
  'status-valiselvitys'?: unknown
  'status-muutoshakemus'?: MuutoshakemusStatus
  'budget-oph-share': number
  'budget-total': number
  attachmentVersions: unknown[]
  changeRequests: unknown[]
  comments: unknown[]
  language: Language
  muutoshakemukset?: Muutoshakemus[]
  normalizedData?: NormalizedHakemusData
  selvitys?: {
    attachments: unknown
    loppuselvitysForm: unknown
    loppuselvitys: {
      "budget-oph-share"?: string
      answers?: Answer[]
    },
    valiselvitysForm: unknown
    valiselvitys: {
      "budget-oph-share"?: string
      answers?: Answer[]
    }
  }
  version: number
  'submitted-version'?: number
  'version-date': string
  'user-key'?: string
  'user-first-name'?: string
  'user-last-name'?: string
  'organization-name': string
  'project-name': string
  refused?: unknown
  'refused-at'?: unknown
  'refused-comment'?: unknown
  payments: unknown[]
  scores: unknown[]
  'selvitys-email'?: unknown
}

export type AvustushakuStatus = 'new' | 'draft' | 'published' | 'resolved' | 'deleted'

export type AvustushakuPhase = 'upcoming' | 'current' | 'ended' | 'unpublished'

export type AvustushakuType = 'yleisavustus' | 'erityisavustus'

export type AvustushakuContent = unknown

export type Avustushaku = {
  id: number
  content: AvustushakuContent
  decision: { updatedAt: string }
  form: number
  form_loppuselvitys: number
  form_valiselvitys: number
  'haku-type': AvustushakuType
  'hankkeen-alkamispaiva'?: string
  'hankkeen-paattymispaiva'?: string
  is_academysize: boolean
  valiselvitysdate?: unknown
  loppuselvitysdate?: unknown
  muutoshakukelpoinen: boolean
  'operation-id'?: unknown
  'operational-unit-id'?: unknown
  'project-id'?: unknown
  phase: AvustushakuPhase
  'register-number': string
  status: AvustushakuStatus
}

export type HelpTexts = { [k: string]: string }

export interface UserInfo {
  'first-name': string
  'surname': string
  email: string
  'person-oid': string
}
