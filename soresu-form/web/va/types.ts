import { Muutoshakemus, MuutoshakemusStatus, Talousarvio } from "./types/muutoshakemus"
import translations from '../../resources/public/translations.json'

export const languages = ['fi', 'sv'] as const
export type Language = typeof languages[number]
export type LegacyTranslations = typeof translations
export type LegacyTranslationDict = Record<string, { [l in Language]: string }>

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

export const ALL_STATUSES = ['unhandled', 'processing', 'plausible', 'rejected', 'accepted'] as const
export type HakemusArviointiStatus = typeof ALL_STATUSES[number]

export type Arvio = {
  id: number
  status: HakemusArviointiStatus
  "presenter-role-id"?: number
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
  "seuranta-answers"?: Answer[]
  rahoitusalue?: string
  talousarviotili?: string
  "allow-visibility-in-external-system"?: boolean
  "should-pay"?: boolean
  "should-pay-comments"?: string
  useDetailedCosts?: boolean
  "summary-comment": string
  roles: Record<string, number[]>
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
  id: number
  "budget-oph-share"?: string
  "project-name"?: string
  "register-number"?: string
  "selvitys-email"?: SelvitysEmail
  answers?: Answer[]
  language: 'fi' | 'sv'
}

export type SelvitysStatus = 'missing' | 'submitted' | 'information_verified' | 'accepted'

export interface SelvitysEmail {
  to: string[]
  send: string
  subject: string
  message: string
}

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
  'selvitys-email'?: SelvitysEmail
  changeRequest?: string
  'taloustarkastettu-by'?: string
  'taloustarkastettu-at'?: string
  'loppuselvitys-information-verified-by'?: string
  'loppuselvitys-information-verified-at'?: string
  'loppuselvitys-information-verification'?: string
  'loppuselvitys-taloustarkastanut-name'?: string
  'loppuselvitys-taloustarkastettu-at'?: string
}

export type AvustushakuStatus = 'new' | 'draft' | 'published' | 'resolved' | 'deleted'

export type AvustushakuPhase = 'upcoming' | 'current' | 'ended' | 'unpublished'

export type AvustushakuType = 'yleisavustus' | 'erityisavustus'

export interface RahoitusAlue {
  rahoitusalue: string
  talousarviotilit: string[]
}

export interface AvustushakuContent {
  name: LocalizedText
  duration: {
    label: LocalizedText
    start: Date | string
    end: Date | string
  }
  "focus-areas": LocalizedTextList
  "selection-criteria": LocalizedTextList
  "payment-size-limit"?: string
  "payment-min-first-batch"?: number
  "payment-fixed-limit"?: number
  "total-grant-size"?: number
  operation?: string
  "operational-unit"?: string
  project?: string
  rahoitusalueet?: RahoitusAlue[]
  multiplemaksuera?: boolean
  "transaction-account"?: string
  "document-type"?: string
  "self-financing-percentage"?: number
}

export interface DecisionLiite {
  group: string
  id: string
  version: string
}

export type Decision = Partial<{
  date: string
  taustaa: LocalizedTextOptional
  "myonteinenlisateksti-Yleissivistävä_koulutus,_ml__varhaiskasvatus": LocalizedTextOptional
  "myonteinenlisateksti-Ammatillinen_koulutus": LocalizedTextOptional
  "myonteinenlisateksti-Aikuiskoulutus_ja_vapaa_sivistystyö": LocalizedTextOptional
  "myonteinenlisateksti-Koko_opetustoimi": LocalizedTextOptional
  "myonteinenlisateksti-Kansalaisopisto": LocalizedTextOptional
  "myonteinenlisateksti-Kansanopisto": LocalizedTextOptional
  "myonteinenlisateksti-Opintokeskus": LocalizedTextOptional
  "myonteinenlisateksti-Kesäyliopisto": LocalizedTextOptional
  "myonteinenlisateksti-Poikkeus": LocalizedTextOptional
  "myonteinenlisateksti-Tiedeolympialaistoiminta": LocalizedTextOptional
  "myonteinenlisateksti-koulut_ja_kotiperuskoulut": LocalizedTextOptional
  "myonteinenlisateksti-Muut_järjestöt": LocalizedTextOptional
  "myonteinenlisateksti-Kristillisten_koulujen_kerhotoiminta": LocalizedTextOptional
  maksu: LocalizedTextOptional
  maksudate: string
  kaytto: LocalizedTextOptional
  kayttotarkoitus: LocalizedTextOptional
  kayttooikeudet: LocalizedTextOptional
  selvitysvelvollisuus: LocalizedTextOptional
  kayttoaika: LocalizedTextOptional
  lisatiedot: LocalizedTextOptional
  myonteinenlisateksti: LocalizedTextOptional
  sovelletutsaannokset: LocalizedTextOptional
  johtaja: LocalizedTextOptional
  valmistelija: LocalizedTextOptional
  liitteet: DecisionLiite[]
  updatedAt: string
}>



export type Avustushaku = {
  id: number
  content: AvustushakuContent
  decision?: Decision
  form: number
  form_loppuselvitys: number
  form_valiselvitys: number
  loppuselvitysForm?: Form
  valiselvitysForm?: Form
  'haku-type': AvustushakuType
  'hankkeen-alkamispaiva'?: string
  'hankkeen-paattymispaiva'?: string
  is_academysize: boolean
  valiselvitysdate?: string
  loppuselvitysdate?: string
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

interface Rule {
  type: string
  triggerId: string
  targetIds: string[]
  params?: any
}

export interface Form {
  content: any
  rules: Rule[]
  created_at: Date
  updated_at: Date
  validationErrors?: any
}

interface LocalizedText {
  fi: string
  sv: string
}

type LocalizedTextOptional = Partial<LocalizedText>

interface LocalizedTextList {
  label: LocalizedText
  items: LocalizedText[]
}

export interface Option {
  value: string
  label: LocalizedText
}

export interface Field {
  id: string
  key?: string
  value?: any
  required?: boolean
  fieldType: string
  fieldClass: string
}

export interface Liite {
  group: string
  attachments: LiiteAttachment[]
}

export interface LiiteAttachment {
  id: string
  langs: {
    fi: string
    sv: string
  }
  versions: LiiteAttachmentVersion[]
}

export interface LiiteAttachmentVersion {
  id: string
  description: string
}
