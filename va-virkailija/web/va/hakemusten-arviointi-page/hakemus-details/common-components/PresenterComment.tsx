import React from 'react'

import { HelpTooltip } from '../../../common-components/HelpTooltip'
import { useHakemustenArviointiDispatch } from '../../arviointiStore'
import { setArvioValue, startHakemusArvioAutoSave } from '../../arviointiReducer'
import { useHakemus } from '../../useHakemus'

type PresenterCommentProps = {
  helpTextKey: string
}

const PresenterComment = ({ helpTextKey }: PresenterCommentProps) => {
  const dispatch = useHakemustenArviointiDispatch()
  const hakemus = useHakemus()

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    dispatch(
      setArvioValue({
        hakemusId: hakemus.id,
        key: 'presentercomment',
        value,
      })
    )
    dispatch(startHakemusArvioAutoSave({ hakemusId: hakemus.id }))
  }
  return (
    <div className="value-edit">
      <label>
        Valmistelijan huomiot
        <HelpTooltip textKey={helpTextKey} direction={'valmistelijan-huomiot'} />
      </label>
      <textarea
        rows={5}
        value={hakemus.arvio.presentercomment ?? ''}
        onChange={onChange}
      ></textarea>
    </div>
  )
}

export default PresenterComment
