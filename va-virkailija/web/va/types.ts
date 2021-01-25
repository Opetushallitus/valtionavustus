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

export type NormalizedHakemusData = {
  "contact-person": string
  "contact-email": string
  "contact-phone": string
}

export type Muutoshakemus = {
  'created-at': string
  'haen-kayttoajan-pidennysta': boolean
  'haettu-kayttoajan-paattymispaiva': string
  'hakemus-id': number
  id: number
  'kayttoajan-pidennys-perustelut': string
  'paatos-created-at': string
  'paatos-sent-at': string
  'paatos-user-key': string
  status: 'accepted' | 'rejected' | 'accepted_with_changes'
}

export type Hakemus = {
  answers: Answer[]
  changeRequests: any
  muutoshakemukset?: Muutoshakemus[]
  normalizedData?: NormalizedHakemusData
  version: any
}
