import {Avustushaku, Hakemus} from "../../../va-common/web/va/types";
import {EnvironmentApiResponse} from "../../../va-common/web/va/types/environment";

export interface User {
  "person-oid": string
  "first-name": string
  surname: string
  email: string
  lang: string
  privileges: string[]
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
