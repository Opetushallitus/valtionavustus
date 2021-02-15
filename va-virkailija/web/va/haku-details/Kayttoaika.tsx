import React from 'react'
import { DateTimePicker } from 'react-widgets'
import moment from 'moment'

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

  function onChangeHandlerFor(id: string) {
    return function onChangeHandler(newDate?: Date) {
      const d = moment(newDate)
      controller.onChangeListener(avustushaku, {id: id}, d.format('YYYY-MM-DD'))
      if (d.isValid()) {
        console.log(`Valid date for ${id}:`, d)
      } else {
        console.log(`NOT valid date for ${id}:`, d)
      }
    }
  }

  return (
    <div className='kayttoaika'>
      <h4>Avustuksen käyttöaika</h4> {/* TODO: Teksteihin */}

      <div className='date-input-container'>
        <div>Hankkeen alkamispäivä</div>
        <DateTimePicker
          name="hankkeen-alkamispaiva"
          onChange={onChangeHandlerFor('hankkeen-alkamispaiva')}
          containerClassName={`datepicker`}
          time={false} />
      </div>

      <div className='date-input-container'>
        <div>Hankkeen päättymipäivä</div>
        <DateTimePicker
          name="hankkeen-paattymispaiva"
          onChange={onChangeHandlerFor('hankkeen-paattymispaiva')}
          containerClassName={`datepicker`}
          time={false} />
      </div>
    </div>
  )
}


