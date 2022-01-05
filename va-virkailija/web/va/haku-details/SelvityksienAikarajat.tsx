import React from 'react'
import moment, {Moment} from 'moment'
import { isoFormat } from 'va-common/web/va/i18n/dateformat'
import { DateInput } from './DateInput'
import { Avustushaku } from 'va-common/web/va/types'

import '../style/selvityksien-aikarajat.less'
import 'react-widgets/styles.css'

interface KayttoaikaProps {
  avustushaku: Avustushaku
  controller: {
    onChangeListener: (avustushaku: Avustushaku, {id: string}, newValue: string) => void
  }
}

export const SelvityksienAikarajat = (props: KayttoaikaProps) => {
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
    <div className='selvityksien-aikarajat'>
      <h4>Väliselvitys</h4>

        <div className='date-input-container' data-test-id='valiselvityksen-aikaraja'>
          <div className="aikaraja-label">Väliselvitys toimitettava viimeistään</div>
          <div className="aikaraja-input">
            <DateInput
              id='valiselvitysdate'
              onChange={onChange}
              defaultValue={getStoredDateFor('valiselvitysdate')}
              allowEmpty={true}/>
          </div>
          <div className="aikaraja-help-text">Väliselvitys avautuu täytettäväksi kun väliselvityspyyntö on lähetetty</div>
        </div>

      <h4>Loppuselvitys</h4>

        <div className='date-input-container' data-test-id='loppuselvityksen-aikaraja'>
          <div className="aikaraja-label">Loppuselvitys toimitettava viimeistään</div>
          <div className="aikaraja-input">
            <DateInput
              id='loppuselvitysdate'
              onChange={onChange}
              defaultValue={getStoredDateFor('loppuselvitysdate')}
              allowEmpty={true}/>
          </div>
        </div>
    </div>
  )
}
