import moment from 'moment-timezone'

export default class DateUtil {
  static asDateString(date: moment.MomentInput): string {
    return moment(date).tz('Europe/Helsinki').format('D.M.YYYY')
  }

  static asTimeString(date: moment.MomentInput): string {
    return moment(date).tz('Europe/Helsinki').format('H.mm')
  }

  static asDateTimeString(date: moment.MomentInput): string {
    return moment(date).tz('Europe/Helsinki').format('D.M.YYYY H.mm')
  }
}
