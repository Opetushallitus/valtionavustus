import React, {useState} from 'react'
import DatePicker from 'react-widgets/DatePicker'
import moment, {Moment} from 'moment'
import { parseDateString } from 'va-common/web/va/i18n/dateformat'

import '../style/kayttoaika.less'
import 'react-widgets/styles.css'

interface KayttoaikaProps {
  avustushaku: object
  controller: {
    onChangeListener: (avustushaku: object, {id: string}, newValue: string) => void
  }
}

export const Kayttoaika = (props: KayttoaikaProps) => {
  const {avustushaku, controller} = props

  function getStoredDateFor(field: string): Date | undefined {
    if (!avustushaku[field]) return undefined
    if (!moment(avustushaku[field]).isValid()) return undefined

    return moment(avustushaku[field]).toDate()
  }

  function onChange(id: string, date: Moment) {
    const value = date.isValid() ? date.format('YYYY-MM-DD') : ''
    controller.onChangeListener(avustushaku, { id: id }, value)
  }

  return (
    <div className='kayttoaika'>
      <h4>Avustuksen käyttöaika</h4>

        <div className='date-input-container' data-test-id='hankkeen-alkamispaiva'>
          <div data-test-id='label'>Avustuksen ensimmäinen käyttöpäivä</div>
          <DateInput
            id='hankkeen-alkamispaiva'
            onChange={onChange}
            defaultValue={getStoredDateFor('hankkeen-alkamispaiva')} />
        </div>

        <div className='date-input-container' data-test-id='hankkeen-paattymispaiva'>
          <div data-test-id='label'>Avustuksen viimeinen käyttöpäivä</div>
          <DateInput
            id='hankkeen-paattymispaiva'
            onChange={onChange}
            defaultValue={getStoredDateFor('hankkeen-paattymispaiva')} />
        </div>
    </div>
  )
}

interface DateInputProps {
  id: string
  defaultValue: Date | undefined
  onChange: (id: string, date: Moment) => void
}

const DateInput = (props: DateInputProps) => {
  const { id, defaultValue, onChange} = props
  const [isValid, setIsValid] = useState(defaultValue !== undefined)

  function onChangeHandlerFor(id: string) {
    return function onChangeHandler(newDate: Date | null | undefined) {
      const date = moment(newDate)
      setIsValid(date.isValid())
      onChange(id, date)
    }
  }

  function getClassNames(): string {
    return isValid ? 'datepicker' : 'datepicker error'
  }

  return (
    <DatePicker
      name={id}
      parse={parseDateString}
      onChange={onChangeHandlerFor(id)}
      value={defaultValue}
      containerClassName={getClassNames()} />
  )
}
