import React from 'react'
import moment, { Moment } from 'moment'
import { isoFormat } from 'soresu-form/web/va/i18n/dateformat'
import { Avustushaku } from 'soresu-form/web/va/types'
import { DateInput } from './DateInput'

import './kayttoaika.css'
import 'react-widgets/styles.css'
import { updateField } from '../hakuReducer'
import { useHakujenHallintaDispatch } from '../hakujenHallintaStore'

interface KayttoaikaProps {
  avustushaku: Avustushaku
  disabled: boolean
}

export const Kayttoaika: React.FC<KayttoaikaProps> = ({ avustushaku, disabled }) => {
  const dispatch = useHakujenHallintaDispatch()

  const getStoredDateFor = (
    field: 'hankkeen-alkamispaiva' | 'hankkeen-paattymispaiva'
  ): Date | undefined => {
    if (!avustushaku[field]) return undefined
    if (!moment(avustushaku[field]).isValid()) return undefined

    return moment(avustushaku[field]).toDate()
  }

  const onChange = (id: string, date: Moment) => {
    const value = date.isValid() ? date.format(isoFormat) : ''
    dispatch(updateField({ avustushaku, field: { id: id }, newValue: value }))
  }

  return (
    <div className="kayttoaika">
      <h4>Avustuksen käyttöaika</h4>

      <div className="date-input-container" data-test-id="hankkeen-alkamispaiva">
        <div data-test-id="label">Avustuksen ensimmäinen käyttöpäivä</div>
        <DateInput
          id="hankkeen-alkamispaiva"
          onChange={onChange}
          defaultValue={getStoredDateFor('hankkeen-alkamispaiva')}
          allowEmpty={false}
          disabled={disabled}
        />
      </div>

      <div className="date-input-container" data-test-id="hankkeen-paattymispaiva">
        <div data-test-id="label">Avustuksen viimeinen käyttöpäivä</div>
        <DateInput
          id="hankkeen-paattymispaiva"
          onChange={onChange}
          defaultValue={getStoredDateFor('hankkeen-paattymispaiva')}
          allowEmpty={false}
          disabled={disabled}
        />
      </div>
    </div>
  )
}
