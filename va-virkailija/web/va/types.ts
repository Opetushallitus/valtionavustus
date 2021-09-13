import {Avustushaku, Hakemus} from "../../../va-common/web/va/types";
import {EnvironmentApiResponse} from "../../../va-common/web/va/types/environment";
import {HakemusSelvitys} from "../../../va-common/web/va/status";

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

interface Role {
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
    status_loppuselvitys: typeof HakemusSelvitys.statuses
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
    selectedHakemusAccessControl: Partial<{
        allowHakemusCommenting: boolean
        allowHakemusStateChanges: boolean
        allowHakemusScoring: boolean
        allowHakemusOfficerEditing: boolean
        allowHakemusCancellation: boolean
    }>
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
