
export const valueTypes = [
  'project',
  'operational-unit',
  'operation'
] as const

export type ValueType = typeof valueTypes[number]
