import React from 'react'
import _ from 'lodash'
import { HelpTooltip } from '../../../common-components/HelpTooltip'
import { Hakemus } from 'soresu-form/web/va/types'
import { useHakemustenArviointiDispatch } from '../../arviointiStore'
import { saveHakemusArvio, setArvioValue } from '../../arviointiReducer'

interface Props {
  hakemus: Hakemus
  allowEditing: boolean
}

const groupOptions = [
  { htmlId: 'set-should-pay-true', value: true, label: 'Kyllä' },
  { htmlId: 'set-should-pay-false', value: false, label: 'Ei' },
]

const ShouldPay = ({ hakemus, allowEditing }: Props) => {
  const dispatch = useHakemustenArviointiDispatch()
  const onHakemusShouldPayChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(
      setArvioValue({
        hakemusId: hakemus.id,
        key: 'should-pay',
        value: event.target.value === 'true',
      })
    )
    dispatch(saveHakemusArvio({ hakemusId: hakemus.id }))
  }
  const options = groupOptions.flatMap((spec) => [
    <input
      id={spec.htmlId}
      key={spec.htmlId}
      type="radio"
      name="should-pay"
      value={String(spec.value)}
      onChange={onHakemusShouldPayChange}
      checked={spec.value === hakemus.arvio['should-pay']}
      disabled={!allowEditing}
    />,
    <label key={spec.htmlId + '-label'} htmlFor={spec.htmlId}>
      {spec.label}
    </label>,
  ])

  return (
    <div id="set-should-pay-grant">
      <h3>
        Maksuun: <HelpTooltip textKey="hankkeen_sivu__seuranta___maksuun" direction={'arviointi'} />
      </h3>
      <fieldset className="soresu-radiobutton-group">{options}</fieldset>
    </div>
  )
}

export default ShouldPay
