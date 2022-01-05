import React from 'react'
import moment, {Moment} from 'moment'
import { isoFormat } from 'va-common/web/va/i18n/dateformat'
import { DateInput } from './DateInput'

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
    const value = date.isValid() ? date.format(isoFormat) : ''
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
            defaultValue={getStoredDateFor('hankkeen-alkamispaiva')}
            allowEmpty={false}/>
        </div>

        <div className='date-input-container' data-test-id='hankkeen-paattymispaiva'>
          <div data-test-id='label'>Avustuksen viimeinen käyttöpäivä</div>
          <DateInput
            id='hankkeen-paattymispaiva'
            onChange={onChange}
            defaultValue={getStoredDateFor('hankkeen-paattymispaiva')}
            allowEmpty={false}/>
        </div>
    </div>
  )
}
