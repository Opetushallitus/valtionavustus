import React, { useEffect, useState } from 'react'
import _ from 'lodash'

import { Hakemus, HelpTexts } from 'soresu-form/web/va/types'

import rejectedReasonsByLanguage from './rejectedReasonsByLanguage.json'
import HelpTooltip from '../../../common-components/HelpTooltip'
import { useHakemustenArviointiDispatch } from '../../arviointiStore'
import { setArvioValue, startHakemusArvioAutoSave } from '../../arviointiReducer'

type PerustelutProps = {
  hakemus: Hakemus
  helpTexts: HelpTexts
  allowEditing?: boolean
}

const Perustelut = ({ hakemus, helpTexts, allowEditing }: PerustelutProps) => {
  const dispatch = useHakemustenArviointiDispatch()
  const [showReasons, toggleReason] = useState(hakemus.arvio.perustelut?.length === 0)
  const hakemusId = hakemus.id
  useEffect(() => {
    toggleReason(hakemus.arvio.perustelut?.length === 0)
  }, [hakemusId])
  const addReason = (reason: string) => {
    const currentPerustelut = hakemus.arvio.perustelut ?? ''
    const newPerustelut = currentPerustelut.length === 0 ? reason : currentPerustelut + ' ' + reason
    dispatch(
      setArvioValue({
        hakemusId: hakemus.id,
        key: 'perustelut',
        value: newPerustelut,
      })
    )
    dispatch(startHakemusArvioAutoSave({ hakemusId: hakemus.id }))
    toggleReason(false)
    setTimeout(function () {
      document
        .getElementById('perustelut-container')
        ?.scrollIntoView({ block: 'start', behavior: 'smooth' })
      document.getElementById('perustelut')?.focus()
    }, 300)
  }
  const rejected = hakemus.arvio.status === 'rejected'
  const languageTitle = hakemus.language === 'fi' ? 'suomeksi' : 'ruotsiksi'
  const rejectedReasons = rejectedReasonsByLanguage[hakemus.language]
  const toggleReasons = () => toggleReason(!showReasons)

  return (
    <div>
      <div className="value-edit" id="perustelut-container">
        <label htmlFor="perustelut">
          Perustelut hakijalle <strong>{languageTitle}</strong>
        </label>
        <HelpTooltip
          testId={'tooltip-perustelut'}
          content={helpTexts['hankkeen_sivu__arviointi___perustelut_hakijalle_suomeksi']}
          direction={'arviointi-slim'}
        />
        {rejected && (
          <a onClick={toggleReasons}>
            {showReasons ? 'Piilota perustelut' : 'Lisää vakioperustelu'}
          </a>
        )}
        {rejected && (
          <div className="radio-container radio-container--perustelut" hidden={!showReasons}>
            {rejectedReasons.map((reason) => (
              <div key={reason} className="radio-row">
                <div onClick={_.partial(addReason, reason)}>{reason}</div>
              </div>
            ))}
          </div>
        )}
        <textarea
          id="perustelut"
          rows={5}
          disabled={!allowEditing}
          value={hakemus.arvio.perustelut ?? ''}
          onChange={(evt) => {
            dispatch(
              setArvioValue({
                hakemusId: hakemus.id,
                key: 'perustelut',
                value: evt.target.value,
              })
            )
            dispatch(startHakemusArvioAutoSave({ hakemusId: hakemus.id }))
          }}
        />
      </div>
    </div>
  )
}

export default Perustelut
