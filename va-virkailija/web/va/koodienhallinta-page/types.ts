export const valueTypes = ['project', 'operational-unit'] as const

export type ValueType = (typeof valueTypes)[number]

export type KoodienhallintaRoutes = ValueType | 'ta-tilit'

export interface CreateTalousarviotili {
  year: number
  code: string
  name: string
  amount: number
}

export type UpdateTalousarviotili = CreateTalousarviotili & { id: number }

export interface Talousarviotili {
  id: number
  year: number | undefined
  code: string
  name: string | undefined
  amount: number | undefined
  'migrated-from-not-normalized-ta-tili': boolean
  deleted: string | undefined
}

interface AvustushakuInfo {
  id: number
  name: string
}

export interface TalousarviotiliWithUsageInfo extends Talousarviotili {
  avustushaut: AvustushakuInfo[]
}
