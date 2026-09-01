import moment, { Moment } from 'moment'

export const fiLongFormat = 'DD.MM.YYYY'
export const fiShortFormat = 'D.M.YYYY'
export const isoFormat = 'YYYY-MM-DD'

export const fiLongDateTimeFormat = 'DD.MM.YYYY HH.mm'
export const fiLongDateTimeFormatWithKlo = 'D.M.YYYY [klo] H.mm'

export const dateformats = [fiLongFormat, fiShortFormat, isoFormat]

export const fiDateFormats = [fiShortFormat, fiLongFormat]

export function parseDateString(str: string, _localizer: unknown): Date | undefined {
  const date = parseDateStringToMoment(str)

  return date && date.isValid() ? date.toDate() : undefined
}

export function parseFinnishTimestamp(
  str: string,
  format: string | string[],
  strict = false
): Moment {
  return moment.tz(str, format, strict, 'Europe/Helsinki')
}

export function isValidFinnishDate(str: string): boolean {
  return parseFinnishTimestamp(str, fiDateFormats, true).isValid()
}

export function parseDateStringToMoment(str: string | undefined | null): Moment | undefined {
  if (!str) return undefined

  return moment(str, dateformats)
}
