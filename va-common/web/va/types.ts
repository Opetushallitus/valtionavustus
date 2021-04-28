import { Talousarvio } from "./types/muutoshakemus"

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

export type NormalizedHakemusData = {
  "contact-person": string
  "contact-email": string
  "contact-phone": string
  "hakemus-id": number
  id: number
  "organization-name": string
  "project-name": string
  "register-number": string
  talousarvio: Talousarvio
  "updated-at": string
}

export type Muutoshakemus = {
  'created-at': string
  'haen-kayttoajan-pidennysta': boolean
  'haettu-kayttoajan-paattymispaiva': string
  'hakemus-id': number
  id: number
  'kayttoajan-pidennys-perustelut': string
  "talousarvio-perustelut"?: string
  talousarvio: Talousarvio
  'paatos-created-at': string
  'paatos-sent-at': string
  'paatos-user-key': string
  status: 'accepted' | 'rejected' | 'accepted_with_changes'
}

export type Hakemus = {
  answers: Answer[]
  arvio: Arvio
  'budget-oph-share': number
  changeRequests: any
  muutoshakemukset?: Muutoshakemus[]
  normalizedData?: NormalizedHakemusData
  selvitys?: {
    loppuselvitys: {
      "budget-oph-share"?: string
      answers?: Answer[]
    },
    valiselvitys: {
      "budget-oph-share"?: string
      answers?: Answer[]
    }
  }
  version: any
}
