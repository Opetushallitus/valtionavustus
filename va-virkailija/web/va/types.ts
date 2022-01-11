import {Avustushaku, Hakemus} from "va-common/web/va/types";
import {EnvironmentApiResponse} from "va-common/web/va/types/environment";
import { HakemusSelvitys, Loppuselvitys } from "va-common/web/va/status";

export interface UserInfo {
  email: string
  "first-name": string
  lang: string
  "person-oid": string
  privileges: string[]
  surname: string
  username: string
}

type RoleType = 'presenting_officer' | 'evaluator'

export interface Role {
    id: number
    name: string
    email?: string
    role: RoleType
    oid?: string
}

interface HakuPrivileges {
    'edit-haku': boolean
    'edit-my-haku-role': boolean
    'score-hakemus': boolean
    'change-hakemus-state': boolean
}

interface Menoluokka {
    type: string
    "translation-fi"?: string
    "translation-sv"?: string
}

export interface HakuData {
    avustushaku: Avustushaku
    environment: EnvironmentApiResponse
    form: {
        content: any
        rules: any
    }
    roles: Role[]
    privileges: HakuPrivileges
    hakemukset: Hakemus[]
    attachments: any
    'budget-total-sum': number
    'budget-oph-share-sum': number
    'budget-granted-sum': number
    'operation-id'?: number
    'operational-unit-id'?: number
    'project-id'?: number
    talousarvio?: Menoluokka[]
}

interface HakemusFilter {
    answers: any[]
    isOpen: boolean
    name: string
    openQuestions: any[]
    status: string[]
    status_valiselvitys: typeof HakemusSelvitys.statuses
    status_loppuselvitys: typeof Loppuselvitys.statuses
    status_muutoshakemus: typeof HakemusSelvitys.statuses
    organization: string
    roleIsOpen: boolean
    evaluator: number | undefined
    presenter?: any
}

export interface HakemusSorter {
    field: string
    order: string
}

export type SelectedHakemusAccessControl = Partial<{
  allowHakemusCommenting: boolean
  allowHakemusStateChanges: boolean
  allowHakemusScoring: boolean
  allowHakemusOfficerEditing: boolean
  allowHakemusCancellation: boolean
}>

export interface State {
    avustushakuList: Avustushaku[]
    hakuData: HakuData
    hakemusFilter: HakemusFilter
    helpTexts: any
    hakemusSorter: HakemusSorter[]
    modal: JSX.Element | undefined
    personSelectHakemusId: number | undefined
    selectedHakemus: Hakemus | undefined
    previouslySelectedHakemus?: Hakemus
    selectedHakemusAccessControl: SelectedHakemusAccessControl
    showOthersScores: boolean
    saveStatus: {
        saveInProgress: boolean
        saveTime: Date | null
        serverError: string
    }
    translations: any
    userInfo: UserInfo
    subTab: string
    loadingSelvitys?: boolean
}

export type Selvitys = 'valiselvitys' | 'loppuselvitys'
export type HakujenHallintaSubTab =
  'haku-editor'
  | 'form-editor'
  | 'decision'
  | 'valiselvitys'
  | 'loppuselvitys'

export interface VaUserSearchResult {
  'person-oid': string
  'first-name'?: string
  surname?: string
  email?: string
  lang: string
  privileges: string[]
}

export interface VaUserSearchResults {
  results: VaUserSearchResult[]
}

export interface Koodisto {
  uri: string
  name: string
  version: unknown
}

interface MuutoshakemuksenVaatimaKentta {
  id: string
  label?: string
}

export interface OnkoMuutoshakukelpoinenAvustushakuOk {
  'is-ok': boolean
  'ok-fields': MuutoshakemuksenVaatimaKentta[]
  'erroneous-fields': MuutoshakemuksenVaatimaKentta[]
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
}

export interface VaCodeValue {
  id?: number
  'value-type': string
  year: number
  code: string
  'code-value': string
  hidden?: boolean
}

export interface Privileges {
  'edit-haku': boolean
  'edit-my-haku-role': boolean
  'score-hakemus': boolean
  'change-hakemus-state': boolean
}

export interface Filter {
  status: string[],
  phase: string[],
  avustushaku: string,
  startdatestart: string,
  startdateend: string,
  enddatestart: string,
  enddateend: string
}

export type FilterId = keyof Filter
export type FilterValue = Filter[FilterId]
