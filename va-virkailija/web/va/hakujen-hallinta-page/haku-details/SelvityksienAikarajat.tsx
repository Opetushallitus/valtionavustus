import React from 'react'
import moment, { Moment } from 'moment'
import { isoFormat } from 'soresu-form/web/va/i18n/dateformat'
import { DateInput } from './DateInput'
import { Avustushaku, HelpTexts } from 'soresu-form/web/va/types'
import HelpTooltip from '../../common-components/HelpTooltip'

import './selvityksien-aikarajat.css'
import 'react-widgets/styles.css'
import { updateField } from '../hakuReducer'
import { useHakujenHallintaDispatch } from '../hakujenHallintaStore'

interface KayttoaikaProps {
  avustushaku: Avustushaku
  helpTexts: HelpTexts
  disabled: boolean
}

export const SelvityksienAikarajat = (props: KayttoaikaProps) => {
  const { avustushaku, helpTexts } = props
  const dispatch = useHakujenHallintaDispatch()
  function getStoredDateFor(field: 'valiselvitysdate' | 'loppuselvitysdate'): Date | undefined {
    if (!avustushaku[field]) return undefined
    if (!moment(avustushaku[field]).isValid()) return undefined

    return moment(avustushaku[field]).toDate()
  }

  function onChange(id: string, date: Moment) {
    const value = date.isValid() ? date.format(isoFormat) : ''
    dispatch(updateField({ avustushaku, field: { id }, newValue: value }))
  }

  return (
    <div className="selvityksien-aikarajat">
      <h4 data-test-id="valiselvitys">
        Väliselvitys
        <HelpTooltip
          content={helpTexts['hakujen_hallinta__päätös___väliselvitys']}
          direction="left"
        />
      </h4>

      <div className="date-input-container" data-test-id="valiselvityksen-aikaraja">
        <div className="aikaraja-label">Väliselvitys toimitettava viimeistään</div>
        <div className="aikaraja-input">
          <DateInput
            id="valiselvitysdate"
            onChange={onChange}
            defaultValue={getStoredDateFor('valiselvitysdate')}
            allowEmpty={true}
            disabled={props.disabled}
          />
        </div>
      </div>

      <h4 data-test-id="loppuselvitys">
        Loppuselvitys
        <HelpTooltip
          content={helpTexts['hakujen_hallinta__päätös___loppuselvitys']}
          direction="left"
        />
      </h4>

      <div className="date-input-container" data-test-id="loppuselvityksen-aikaraja">
        <div className="aikaraja-label">Loppuselvitys toimitettava viimeistään</div>
        <div className="aikaraja-input">
          <DateInput
            id="loppuselvitysdate"
            onChange={onChange}
            defaultValue={getStoredDateFor('loppuselvitysdate')}
            allowEmpty={true}
            disabled={props.disabled}
          />
        </div>
      </div>
    </div>
  )
}
