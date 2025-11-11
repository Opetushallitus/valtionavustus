import {
  Muutoshakemus as MuutoshakemusType,
  Muutoshakemus,
  MuutoshakemusStatus,
  Talousarvio,
} from './types/muutoshakemus'
import translations from '../../../server/resources/public/translations.json'
import { ImmutableObject } from 'seamless-immutable'
import { HakemusAccessControl, VaCodeValue } from '../../../va-virkailija/web/va/types'
import { TalousarviotiliWithKoulutusasteet } from '../../../va-virkailija/web/va/hakujen-hallinta-page/hakuReducer'

export const languages = ['fi', 'sv'] as const
export type Language = (typeof languages)[number]
export type LegacyTranslations = typeof translations
export type LegacyTranslationDict = {
  [k in string]: string | LegacyTranslationDict
}

export type HakemusFormState = {
  avustushaku: any
  form: any
  configuration: any
  answersDelta: AnswersDelta
  saveStatus: any
  changeRequests: any
  attachmentVersions: any
  extensionApi: any
  koodistos?: Koodistos
  koodistosLoader?: () => void
}

export interface Koodisto {
  uri: string
  name: string
  version: unknown
}

export interface Koodistos {
  content: Koodisto[] | null
  loading: boolean
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

export interface PersonScoreAverage {
  'person-oid': string
  'first-name': string
  'last-name': string
  email?: string
  'score-average': number
}

export interface Scoring {
  'arvio-id': number
  'score-total-average': number
  'score-averages-by-user'?: PersonScoreAverage[]
}

export interface Score {
  'arvio-id': number
  'person-oid': string
  'first-name': string
  'last-name': string
  email?: string
  'selection-criteria-index': number
  score: number
  'created-at': string
  'modified-at': string
}

interface Tag {
  value: string[]
}

interface Oppilaitokset {
  names: string[]
}

export const ALL_STATUSES = [
  'unhandled',
  'processing',
  'plausible',
  'rejected',
  'accepted',
] as const
export type HakemusArviointiStatus = (typeof ALL_STATUSES)[number]

export interface Answers {
  value: Answer[]
}

export type ChangeLogEntry = {
  type:
    | 'budget-change'
    | 'oppilaitokset-change'
    | 'summary-comment'
    | 'overridden-answers-change'
    | 'presenter-comment'
    | 'status-change'
    | 'should-pay-change'
  timestamp: string
  'first-name': string
  'last-name': string
  data: any
}

export type Arvio = {
  id: number
  status: HakemusArviointiStatus
  'presenter-role-id'?: number
  'budget-granted'?: number
  costsGranted?: number
  'overridden-answers'?: Answers
  hasChanges?: boolean
  scoring?: Scoring
  presentercomment?: string
  academysize?: number
  tags?: Tag
  perustelut?: string
  oppilaitokset?: Oppilaitokset
  'seuranta-answers'?: Answer[]
  rahoitusalue?: string
  talousarviotili?: string
  'allow-visibility-in-external-system'?: boolean
  'should-pay'?: boolean
  'should-pay-comments'?: string
  useDetailedCosts?: boolean
  'summary-comment': string
  roles: Record<string, number[]>
  changelog?: ChangeLogEntry[]
}

export interface NormalizedHakemusData {
  'contact-person': string
  'contact-email': string
  'contact-phone': string
  'trusted-contact-name'?: string
  'trusted-contact-email'?: string
  'trusted-contact-phone'?: string
  'hakemus-id': number
  id: number
  'organization-name': string
  'project-name': string
  'register-number': string
  talousarvio?: Talousarvio
  'created-at': string
  'updated-at': string
}

export type HakemusStatus =
  | 'new'
  | 'draft'
  | 'submitted'
  | 'pending_change_request'
  | 'officer_edit'
  | 'cancelled'
  | 'refused'
  | 'applicant_edit'

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
  pitkaviite: string
  'project-code'?: string
  'user-name'?: string
  'batch-id'?: number
  phase?: number
  'payment-sum': number
}

export interface Comment {
  id: number
  arvio_id: number
  created_at: string
  first_name: string
  last_name: string
  email?: string
  comment: string
  'person-oid'?: string
}

export interface Selvitys {
  id: number
  'budget-oph-share': string
  'budget-total': string
  'project-name'?: string
  'register-number'?: string
  'selvitys-email'?: SelvitysEmail
  status: HakemusStatus
  'status-loppuselvitys': SelvitysStatus
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

export interface ChangeRequest {
  'status-comment': string
  'version-date': string
  'user-oid': string
}

export interface LoadedHakemusData {
  project: VaCodeValue
  talousarviotilit: TalousarviotiliWithKoulutusasteet[]
  normalizedData?: NormalizedHakemusData
  muutoshakemukset: MuutoshakemusType[]
  scores: Score[]
  scoring: Scoring
  payments: Payment[]
  comments: Comment[]
  selvitys: Hakemus['selvitys']
  changeRequests: ChangeRequest[]
  attachmentVersions: unknown[]
  accessControl: HakemusAccessControl
}

export interface HakemusSelvitys {
  attachments: unknown
  loppuselvitysForm?: ImmutableObject<Form>
  loppuselvitys: Selvitys
  loppuselvitysChangeRequests?: Hakemus[]
  valiselvitysForm?: ImmutableObject<Form>
  valiselvitys: Selvitys
}

export interface Hakemus {
  id: number
  answers: Answer[]
  arvio: Arvio
  status: HakemusStatus
  'keskeytetty-aloittamatta': boolean
  'status-comment'?: unknown
  'status-loppuselvitys': SelvitysStatus
  'status-valiselvitys': SelvitysStatus
  'status-muutoshakemus'?: MuutoshakemusStatus
  'budget-oph-share': number
  'budget-total': number
  'register-number'?: string
  attachmentVersions: unknown[]
  changeRequests: ChangeRequest[]
  comments?: Comment[]
  language: Language
  muutoshakemusUrl: string
  muutoshakemukset?: Muutoshakemus[]
  normalizedData?: NormalizedHakemusData
  selvitys?: HakemusSelvitys
  version: number
  'submitted-version'?: number
  'version-date': string
  'user-key'?: string
  'user-first-name'?: string
  'user-last-name'?: string
  'organization-name': string
  'project-name': string
  refused?: boolean
  'refused-at'?: unknown
  'refused-comment'?: unknown
  payments: Payment[]
  scores: Score[]
  'selvitys-email'?: SelvitysEmail
  'taloustarkastettu-by'?: string
  'taloustarkastettu-at'?: string
  'loppuselvitys-information-verified-by'?: string
  'loppuselvitys-information-verified-at'?: string
  'loppuselvitys-information-verification'?: string
  'loppuselvitys-taloustarkastanut-name'?: string
  'loppuselvitys-taloustarkastettu-at'?: string
  'loppuselvitys-change-request-pending'?: boolean
  'loppuselvitys-change-request-sent'?: boolean
  project?: VaCodeValue
  talousarviotilit?: TalousarviotiliWithKoulutusasteet[]
  accessControl?: HakemusAccessControl
}

export const AVUSTUSHAKU_STATUSES = ['new', 'draft', 'published', 'resolved', 'deleted'] as const
export type AvustushakuStatus = (typeof AVUSTUSHAKU_STATUSES)[number]

export const AVUSTUSHAKU_PHASES = ['upcoming', 'current', 'ended', 'unpublished'] as const

export type AvustushakuPhase = (typeof AVUSTUSHAKU_PHASES)[number]

export type AvustushakuType = 'yleisavustus' | 'erityisavustus'

export interface AvustushakuContent {
  name: LocalizedText
  duration: {
    label: LocalizedText
    start: Date | string
    end: Date | string
  }
  'focus-areas': LocalizedTextList
  'selection-criteria': LocalizedTextList
  'payment-size-limit'?: string
  'payment-min-first-batch'?: number
  'payment-fixed-limit'?: number
  'total-grant-size'?: number
  operation?: string
  'operational-unit'?: string
  project?: string
  multiplemaksuera?: boolean
  'transaction-account'?: string
  'document-type'?: string
  'self-financing-percentage'?: number
  allow_visibility_in_external_system: boolean
  arvioitu_maksupaiva?: string
}

export interface DecisionLiite {
  group: string
  id: string
  version: string
}

type Underscore<S extends string> = S extends ' ' ? never : S

type ToUnderscore<T extends string, P extends string = ''> = string extends T
  ? string
  : T extends `${infer C0}${infer R}`
    ? ToUnderscore<R, `${P}${C0 extends Underscore<C0> ? '' : '_'}${C0}`>
    : P

type Keyprefix<Prefix extends string, Key> = Key extends string
  ? `${Prefix}${ToUnderscore<Key>}`
  : never

export const Koulutusasteet = [
  'Varhaiskasvatus',
  'Yleissivistävä koulutus, ml. varhaiskasvatus',
  'Esiopetus',
  'Perusopetus',
  'Lukiokoulutus',
  'Taiteen perusopetus',
  'Ammatillinen koulutus',
  'Vapaa sivistystyö',
  'Kansalaisopisto',
  'Tiedeolympialaistoiminta',
  'Suomi-koulut ja kotiperuskoulut',
  'Muut järjestöt',
  'Kristillisten koulujen kerhotoiminta',
  'Kansanopisto',
  'Opintokeskus',
  'Kesäyliopisto',
  'Korkeakoulutus',
  'Aikuiskoulutus ja vapaa sivistystyö',
  'Koko opetustoimi',
  'Poikkeus',
  'Muut hakuryhmät',
  'Muut',
] as const

type MyonteinenLisateksti = Keyprefix<'myonteinenlisateksti-', (typeof Koulutusasteet)[number]>

export type Decision = Partial<
  {
    date: string
    taustaa: LocalizedTextOptional
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
    'dont-include-pakote-ohje'?: boolean
    johtaja: LocalizedTextOptional
    valmistelija: LocalizedTextOptional
    liitteet: DecisionLiite[]
    updatedAt: string
  } & MyonteinenLisateksti
>

export type Avustushaku = {
  id: number
  content: AvustushakuContent
  decision?: Decision
  form: number
  form_loppuselvitys: number
  form_valiselvitys: number
  'haku-type': AvustushakuType
  'hankkeen-alkamispaiva'?: string
  'hankkeen-paattymispaiva'?: string
  is_academysize: boolean
  valiselvitysdate?: string
  loppuselvitysdate?: string
  muutoshakukelpoinen: boolean
  'operational-unit-id'?: unknown
  'operational-unit-code'?: string
  phase: AvustushakuPhase
  'register-number': string | null
  'hallinnoiavustuksia-register-number': string | null
  status: AvustushakuStatus
  allow_visibility_in_external_system: boolean
  arvioitu_maksupaiva?: string
}

export interface Raportointivelvoite {
  id?: number
  raportointilaji: string
  maaraaika: string
  'asha-tunnus': string
  lisatiedot?: string
}

export type HelpTexts = { [k: string]: string }

interface Rule {
  type: string
  triggerId: string
  targetIds: string[]
  params?: any
}

export interface Form {
  id?: any
  content: Field[]
  rules: Rule[]
  created_at: Date
  updated_at: Date
  validationErrors?: any
}
export interface LocalizedText {
  fi: string
  sv: string
}

type LocalizedTextOptional = Partial<LocalizedText>

interface LocalizedTextList {
  label: LocalizedText
  items: LocalizedText[]
}

export const fieldTypes: { [f in AddableFieldType]: FieldClass } = {
  textField: 'formField',
  textArea: 'formField',
  radioButton: 'formField',
  checkboxButton: 'formField',
  dropdown: 'formField',
  namedAttachment: 'formField',
  koodistoField: 'formField',
  fixedMultiplierMoneyField: 'formField',
  p: 'infoElement',
  h1: 'infoElement',
  h3: 'infoElement',
  link: 'infoElement',
  theme: 'wrapperElement',
  fieldset: 'wrapperElement',
  growingFieldset: 'wrapperElement',
  growingFieldsetChild: 'wrapperElement',
}

export const addableFields = [
  'textField',
  'textArea',
  'radioButton',
  'checkboxButton',
  'dropdown',
  'namedAttachment',
  'koodistoField',
  'p',
  'h3',
  'link',
  'theme',
  'fieldset',
  'growingFieldset',
  'growingFieldsetChild',
  'h1',
  'fixedMultiplierMoneyField',
] as const
export type AddableFieldType = (typeof addableFields)[number]
export type NonAddableFieldType =
  | 'fixedMultiplierField'
  | 'moneyField'
  | 'emailField'
  | 'bic'
  | 'iban'
  | 'tableField'
  | 'integerField'
  | 'decimalField'
  | 'finnishBusinessIdField'
  | 'vaEmailNotification'
export type BudgetFieldType =
  | 'vaBudget'
  | 'vaBudgetSummaryElement'
  | 'vaSelfFinancingField'
  | 'vaBudgetItemElement'
  | 'vaTraineeDayCalculator'
  | 'vaSummingBudgetElement'
  | 'vaProjectDescription'
export type FieldType =
  | AddableFieldType
  | NonAddableFieldType
  | BudgetFieldType
  | 'endOfDateRange'
  | 'bulletList'
export type FieldClass = 'formField' | 'infoElement' | 'wrapperElement'

export interface Option {
  value: string
  label: LocalizedText
}

export interface Field {
  id: string
  key?: string
  value?: any
  required?: boolean
  fieldType: FieldType
  fieldClass: FieldClass
  options?: Option[]
  children?: Field[]
  params?: any
  label?: LocalizedText
  helpText?: LocalizedText
  text?: LocalizedText
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
