import moment from 'moment-timezone'

export default class DateUtil {
  static asDateString(date) {
    return moment(date).tz('Europe/Helsinki').format('D.M.YYYY')
  }

  static asTimeString(date) {
    return moment(date).tz('Europe/Helsinki').format('H.mm')
  }
}
