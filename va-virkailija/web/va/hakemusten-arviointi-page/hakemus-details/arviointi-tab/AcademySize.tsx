import React from 'react'

import { Avustushaku, Hakemus } from 'soresu-form/web/va/types'

import { useHakemustenArviointiDispatch } from '../../arviointiStore'
import { setArvioValue, startHakemusArvioAutoSave } from '../../arviointiReducer'

type AcademySizeProps = {
  avustushaku: Avustushaku
  hakemus: Hakemus
  allowEditing?: boolean
}

const isValueValid = (val: string) => {
  const valueInt = parseInt(val)
  return isNaN(valueInt)
}

const AcademySize = ({ avustushaku, hakemus, allowEditing }: AcademySizeProps) => {
  const dispatch = useHakemustenArviointiDispatch()

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    const valueInt = parseInt(value)
    dispatch(
      setArvioValue({
        key: 'academysize',
        value: valueInt,
        hakemusId: hakemus.id,
      })
    )
    dispatch(startHakemusArvioAutoSave({ hakemusId: hakemus.id }))
  }
  if (!avustushaku.is_academysize) {
    return null
  }
  const invalid = isValueValid('' + hakemus.arvio.academysize)
  return (
    <div className="hakemus-arviointi-section hakemus-arviointi-section--academy-size">
      <label>Oppilaitoksen koko:</label>
      <input
        type="number"
        className={invalid ? 'error input-number-sm' : 'input-number-sm'}
        value={hakemus.arvio.academysize}
        onChange={onChange}
        disabled={!allowEditing}
      />
    </div>
  )
}

export default AcademySize
