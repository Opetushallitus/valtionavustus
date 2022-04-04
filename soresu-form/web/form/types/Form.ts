import {
  Answers,
  AvustushakuContent, Decision, Field,
  Form,
  HakemusStatus,
  Language,
  LegacyTranslationDict, NormalizedHakemusData
} from "soresu-form/web/va/types";
import UrlCreator from "soresu-form/web/form/UrlCreator";
import ResponseParser from "soresu-form/web/form/ResponseParser";
import Immutable from "seamless-immutable";
import VaSyntaxValidator from "soresu-form/web/va/VaSyntaxValidator";
import {EnvironmentApiResponse} from "soresu-form/web/va/types/environment";
import {EventStream, Property} from "baconjs";
import {Muutoshakemus} from "soresu-form/web/va/types/muutoshakemus";

export interface UrlContent {
  parsedQuery: any
  location: Location
}

export interface FormOperations {
  "chooseInitialLanguage": (urlContent: UrlContent) => Language,
  "containsExistingEntityId": (urlContent: UrlContent) => boolean,
  "isFieldEnabled": (saved: StateLoopState) => any,
  "onFieldUpdate": (state: StateLoopState, field: any) => void,
  "isSaveDraftAllowed": (state: StateLoopState) => boolean,
  "isNotFirstEdit": (state: StateLoopState) => boolean,
  "createUiStateIdentifier": (state: StateLoopState) => string,
  "urlCreator": UrlCreator,
  "responseParser": ResponseParser,
  "printEntityId": (state: StateLoopState) => number,
  "onFieldValid"?: (state: StateLoopState, field: Field, value: any) => void
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
  saveInProgress: boolean
  serverError: string
  values: Answers | {}
  savedObject: SavedObject | null
  attachments: any | null
  attachmentUploadsInProgress: Record<string, boolean>
}

interface InitialConfiguration {
  form: Immutable.ImmutableObject<Form>
  embedForMuutoshakemus: boolean
  preview: boolean
  lang: Language
  translations: LegacyTranslationDict
}

export interface InitialStateLoopState {
  form: Form
  tokenValidation: {
    valid: boolean
  }
  saveStatus: InitialSaveStatus
  configuration: InitialConfiguration
  extensionApi: {
    formOperations: FormOperations
    customFieldSyntaxValidator: typeof VaSyntaxValidator
    onInitialStateLoaded: (state: StateLoopState) => void
  }
}

export interface InitialStateTemplate {
  form: any
  tokenValidation: EventStream<{ valid: boolean }> | {valid: boolean}
  saveStatus: {
    changes: false,
    saveInProgress: false,
    serverError: "",
    values: Property<{} | Answers | undefined>,
    savedObject: EventStream<SavedObject | null>,
    attachments: EventStream<any>,
    attachmentUploadsInProgress: {}
  }
  configuration: {
    form: EventStream<Immutable.ImmutableObject<Form>>
    embedForMuutoshakemus: boolean
    preview: boolean
    lang: Language
    translations: EventStream<any>
  }
  extensionApi: {
    formOperations: FormOperations
    customFieldSyntaxValidator: typeof VaSyntaxValidator
    onInitialStateLoaded: (state: StateLoopState) => void
  }
}

export interface HakijaAvustusHaku {
  id: number
  status: "new" | "draft" | "published" | "resolved" | "deleted"
  phase: "unpublished" | "upcoming" | "current" | "ended"
  'haku-type': "yleisavustus" | "erityisavustus"
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
  'project-id'?: number
  muutoshakukelpoinen: boolean
}

interface SelvitysAppStateLoopState extends InitialStateLoopState {
  avustushaku: HakijaAvustusHaku
  configuration: InitialConfiguration & {
    environment: EnvironmentApiResponse
  }
  saveStatus: InitialSaveStatus & {
    hakemusId: number
  }
}

interface VaAppStateLoopState extends InitialStateLoopState {
  avustushaku: HakijaAvustusHaku
  configuration: InitialConfiguration & {
    environment: EnvironmentApiResponse
  }
  saveStatus: InitialSaveStatus & {
    hakemusId: number
  }
  normalizedHakemus: NormalizedHakemusData | undefined
  muutoshakemukset: Muutoshakemus[]
  token: string
}

export type StateLoopState = SelvitysAppStateLoopState | VaAppStateLoopState
