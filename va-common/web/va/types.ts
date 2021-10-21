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

interface PersonScoreAverage {
  'person-oid': string
  'first-name': string
  'last-name': string
  'email'?: string
  'score-average': number
}

export interface Scoring {
  'arvio-id': number
  'score-total-average': number
  'score-averages-by-user': PersonScoreAverage[]
}

export interface Score {
  'arvio-id': number
  'person-oid': string
  'first-name': string
  'last-name': string
  'email'?: string
  'selection-criteria-index': number
  'score': number
  'created-at': string
  'modified-at': string
}

interface Tag {
  value: string[]
}

interface Oppilaitokset {
  names: string[]
}

type Arvio = {
  id: number
  "budget-granted"?: number
  costsGranted?: number
  "overridden-answers"?: {
    value: Answer[]
  }
  hasChanges?: boolean
  scoring?: Scoring
  'presentercomment'?: string
  academysize?: number
  tags?: Tag
  perustelut?: string
  oppilaitokset?: Oppilaitokset
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

type PaymentStatus = 'created' | 'waiting' | 'sent' | 'paid'

export interface Payment {
  id?: number
  version?: number
  'version-closed'?: string
  'created-at': string
  'application-id': number
  'application-version?': number
  'paymentstatus-id': PaymentStatus
  'file-name'?: string
  'pitkaviite': string
  'user-name'?: string
  'batch-id'?: number
  'phase'?: number
  'payment-sum': number
}

export interface Comment {
  id: number
  'arvio_id': number
  'created_at': string
  'first_name': string
  'last_name': string
  email?: string
  comment: string
  'person-oid'?: string
}

export interface Selvitys {
  "budget-oph-share"?: string
  answers?: Answer[]
  language: 'fi' | 'sv'
}

export type SelvitysStatus = 'missing' | 'submitted' | 'information_verified' | 'accepted'

export interface Hakemus {
  id: number
  answers: Answer[]
  arvio: Arvio
  status: HakemusStatus
  'status-comment'?: unknown
  'status-loppuselvitys': SelvitysStatus
  'status-valiselvitys': SelvitysStatus
  'status-muutoshakemus'?: MuutoshakemusStatus
  'budget-oph-share': number
  'budget-total': number
  attachmentVersions: unknown[]
  changeRequests: unknown[]
  comments?: Comment[]
  language: Language
  muutoshakemusUrl: string
  muutoshakemukset?: Muutoshakemus[]
  normalizedData?: NormalizedHakemusData
  selvitys?: {
    attachments: unknown
    loppuselvitysForm: unknown
    loppuselvitys: Selvitys,
    valiselvitysForm: unknown
    valiselvitys: Selvitys
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
  payments: Payment[]
  scores: unknown[]
  'selvitys-email'?: unknown
  changeRequest?: string
  'loppuselvitys-information-verified-by'?: string
  'loppuselvitys-information-verified-at'?: string
  'loppuselvitys-information-verification'?: string
}

export type AvustushakuStatus = 'new' | 'draft' | 'published' | 'resolved' | 'deleted'

export type AvustushakuPhase = 'upcoming' | 'current' | 'ended' | 'unpublished'

export type AvustushakuType = 'yleisavustus' | 'erityisavustus'

export interface RahoitusAlue {
  rahoitusalue: string
  talousarviotilit: string[]
}

export type AvustushakuContent = any

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
