import moment, { Moment } from 'moment'

export const fiLongFormat = 'DD.MM.YYYY'
export const fiShortFormat = 'D.M.YYYY'
export const isoFormat = 'YYYY-MM-DD'

export const fiLongDateTimeFormat = 'DD.MM.YYYY HH.mm'
export const fiLongDateTimeFormatWithKlo = 'D.M.YYYY [klo] H.mm'

export const dateformats = [fiLongFormat, fiShortFormat, isoFormat]

export function parseDateString(str: string, _localizer: unknown): Date | undefined {
  const date = parseDateStringToMoment(str)

  return date && date.isValid() ? date.toDate() : undefined
}

export function parseDateStringToMoment(str: string | undefined | null): Moment | undefined {
  if(!str) return undefined

  return moment(str, dateformats)
}


