import {
  Answers,
  AvustushakuContent,
  Decision,
  Field,
  Form,
  HakemusStatus,
  Language,
  LegacyTranslations,
  NormalizedHakemusData,
} from 'soresu-form/web/va/types'
import UrlCreator from 'soresu-form/web/form/UrlCreator'
import ResponseParser from 'soresu-form/web/form/ResponseParser'
import Immutable from 'seamless-immutable'
import VaSyntaxValidator from 'soresu-form/web/va/VaSyntaxValidator'
import { EnvironmentApiResponse } from 'soresu-form/web/va/types/environment'
import { EventStream, Property } from 'baconjs'
import { Muutoshakemus } from 'soresu-form/web/va/types/muutoshakemus'

export interface UrlContent {
  parsedQuery: any
  location: Location
}

export interface InitialValues {
  language: Language
}

interface VaSubmission {
  created_at: string
  form: number
  version: number
  version_closed?: string
  answers: Answers
}

interface SubmissionValidationError {
  error: string
  info?: any
}

export interface HakijaHakemus {
  id?: string
  'created-at'?: string
  version: number
  'version-date': string
  status: HakemusStatus
  'status-comment'?: string
  'register-number'?: string
  submission: VaSubmission
  'validation-errors': SubmissionValidationError[]
  'loppuselvitys-information-verified-at'?: string
  'submitted-version'?: number
  refused?: boolean
  'refused-comment'?: string
  'refused-at'?: string
}

export interface SavedObject extends HakijaHakemus {
  'selvitys-updatable': boolean
}

export interface InitialSaveStatus {
  changes: boolean
  hakemusId?: string
  saveInProgress: boolean
  serverError: string
  values: Answers
  savedObject: SavedObject | null
  attachments: any | null
  attachmentUploadsInProgress: Record<string, boolean>
}

interface InitialConfiguration {
  form: Immutable.ImmutableObject<Form>
  embedForMuutoshakemus: boolean
  preview: boolean
  lang: Language
  translations: LegacyTranslations
}

export interface FormOperations<T> {
  chooseInitialLanguage: (urlContent: UrlContent) => Language
  containsExistingEntityId: (urlContent: UrlContent) => boolean
  isFieldEnabled?: (fieldId: string) => boolean
  onFieldUpdate: (state: T, field: any) => void
  isSaveDraftAllowed: (state: T) => boolean
  isNotFirstEdit: (state: T) => boolean
  createUiStateIdentifier: (state: T) => string
  urlCreator: UrlCreator
  responseParser: ResponseParser
  printEntityId: (state: T) => number
  onFieldValid?: (state: T, field: Field, value: any) => void
}

export interface BaseStateLoopState<T> {
  avustushaku?: HakijaAvustusHaku
  form: Form
  tokenValidation: {
    valid: boolean
  }
  saveStatus: InitialSaveStatus & {
    hakemusId: number
  }
  configuration: InitialConfiguration & {
    environment: EnvironmentApiResponse
  }
  extensionApi: {
    formOperations: FormOperations<T>
    customFieldSyntaxValidator: typeof VaSyntaxValidator
    onInitialStateLoaded: (state: T) => void
  }
}

export interface InitialStateTemplate<T extends BaseStateLoopState<T>> {
  avustushaku?: EventStream<HakijaAvustusHaku>
  form: any
  tokenValidation: EventStream<{ valid: boolean }> | { valid: boolean }
  saveStatus: {
    changes: false
    saveInProgress: false
    serverError: ''
    values: Property<{} | Answers | undefined>
    savedObject: EventStream<SavedObject | null>
    attachments: EventStream<any>
    attachmentUploadsInProgress: {}
    hakemusId?: string
  }
  configuration: {
    form: EventStream<Immutable.ImmutableObject<Form>>
    embedForMuutoshakemus: boolean
    preview: boolean
    lang: Language
    translations: EventStream<any>
    environment?: EventStream<EnvironmentApiResponse>
  }
  extensionApi: {
    formOperations: FormOperations<T>
    customFieldSyntaxValidator: typeof VaSyntaxValidator
    onInitialStateLoaded: (state: T) => void
  }
}

export interface SelvitysAppStateTemplate extends InitialStateTemplate<SelvitysAppStateLoopState> {}

export interface VaAppStateTemplate extends InitialStateTemplate<VaAppStateLoopState> {
  normalizedHakemus: EventStream<NormalizedHakemusData>
  muutoshakemukset: EventStream<Muutoshakemus[]>
  token: string
}

export interface HakijaAvustusHaku {
  id: number
  status: 'new' | 'draft' | 'published' | 'resolved' | 'deleted'
  phase: 'unpublished' | 'upcoming' | 'current' | 'ended'
  'haku-type': 'yleisavustus' | 'erityisavustus'
  is_academysize: boolean
  'register-number'?: string
  content: AvustushakuContent
  'hankkeen-alkamispaiva'?: string
  'hankkeen-paattymispaiva'?: string
  loppuselvitysdate?: string
  valiselvitysdate?: string
  decision?: Decision
  form: number
  form_loppuselvitys?: number
  form_valiselvitys?: number
  'operation-id'?: number
  'operational-unit-id'?: number
  muutoshakukelpoinen: boolean
}

export interface SelvitysAppStateLoopState extends BaseStateLoopState<SelvitysAppStateLoopState> {}

export interface VaAppStateLoopState extends BaseStateLoopState<VaAppStateLoopState> {
  normalizedHakemus: NormalizedHakemusData | undefined
  muutoshakemukset: Muutoshakemus[]
  token: string
  isTokenValid: boolean
}

export type StateLoopState = SelvitysAppStateLoopState | VaAppStateLoopState
