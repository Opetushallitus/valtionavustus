import moment from "moment"

export const fiLongFormat = 'DD.MM.YYYY'
export const fiShortFormat = 'D.M.YYYY'
export const isoFormat = 'YYYY-MM-DD'

const dateformats = [fiLongFormat, fiShortFormat, isoFormat]

export function parseDateString(str: string, _localizer: unknown): Date | undefined {
  if(!str) return undefined

  const date = moment(str, dateformats)
  return date.isValid() ? date.toDate() : undefined
}


