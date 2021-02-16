import React, {useState} from 'react'
import { DateTimePicker } from 'react-widgets'
import moment, {Moment} from 'moment'

import '../style/kayttoaika.less'
import 'react-widgets/dist/css/react-widgets.css'

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
          <div>Hankkeen alkamispäivä</div>
          <DateInput
            id='hankkeen-alkamispaiva'
            onChange={onChange}
            defaultValue={getStoredDateFor('hankkeen-alkamispaiva')} />
        </div>

        <div className='date-input-container' data-test-id='hankkeen-paattymispaiva'>
          <div>Hankkeen päättymispäivä</div>
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
    return function onChangeHandler(newDate?: Date) {
      const date = moment(newDate)
      setIsValid(date.isValid())
      onChange(id, date)
    }
  }

  function getClassNames(): string {
    return isValid ? 'datepicker' : 'datepicker error'
  }

  return (
    <DateTimePicker
      name={id}
      onChange={onChangeHandlerFor(id)}
      defaultValue={defaultValue}
      containerClassName={getClassNames()}
      time={false} />
  )
}
