import { Moment } from 'moment'

/*
Should be 2 days in the future but not be saturday or sunday
in that case the next monday
 */
export const createDefaultErapaiva = (moment: Moment): Date => {
  const sunday = 0
  const saturday = 6
  const day = moment.clone().add(2, 'day')
  const dayNumber = day.day()
  if (dayNumber === sunday) {
    day.add(1, 'day')
  } else if (dayNumber === saturday) {
    day.add(2, 'day')
  }
  return day.toDate()
}
