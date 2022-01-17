import React from 'react'
import moment, {Moment} from 'moment'
import { isoFormat } from 'soresu-form/web/va/i18n/dateformat'
import { DateInput } from './DateInput'
import { Avustushaku } from 'soresu-form/web/va/types'
import HelpTooltip from '../HelpTooltip'

import '../style/selvityksien-aikarajat.less'
import 'react-widgets/styles.css'

interface KayttoaikaProps {
  avustushaku: Avustushaku
  controller: {
    onChangeListener: (avustushaku: Avustushaku, { id }: { id: string }, newValue: string) => void
  }
  helpTexts: any
}

export const SelvityksienAikarajat = (props: KayttoaikaProps) => {
  const {avustushaku, controller, helpTexts} = props

  function getStoredDateFor(field: 'valiselvitysdate' | 'loppuselvitysdate'): Date | undefined {
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
      <h4 data-test-id="valiselvitys">Väliselvitys <HelpTooltip content={helpTexts["hakujen_hallinta__päätös___väliselvitys"]} direction="left" /> </h4>

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

      <h4 data-test-id="loppuselvitys">Loppuselvitys <HelpTooltip content={helpTexts["hakujen_hallinta__päätös___loppuselvitys"]} direction="left" /> </h4>

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
