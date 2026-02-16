import React from 'react'
import { HelpTooltip } from '../../../common-components/HelpTooltip'
import { Hakemus } from 'soresu-form/web/va/types'
import { useHakemustenArviointiDispatch } from '../../arviointiStore'
import { saveHakemusArvioSoon, setArvioValue } from '../../arviointiReducer'

interface Props {
  hakemus: Hakemus
  allowEditing: boolean
}

const groupOptions = [
  {
    htmlId: 'set-allow-visibility-in-external-system-true',
    value: true,
    label: 'Kyllä',
    testId: 'set-allow-visibility-in-external-system-true',
  },
  {
    htmlId: 'set-allow-visibility-in-external-system-false',
    value: false,
    label: 'Ei',
  },
]

const AllowVisibilityInExternalSystem = ({ hakemus, allowEditing }: Props) => {
  const dispatch = useHakemustenArviointiDispatch()
  const onHakemusAllowVisibilityInExternalSystem = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(
      setArvioValue({
        hakemusId: hakemus.id,
        key: 'allow-visibility-in-external-system',
        value: event.target.value === 'true',
      })
    )
    dispatch(saveHakemusArvioSoon({ hakemusId: hakemus.id }))
  }
  const arvio = hakemus.arvio
  const selectedAllowVisibilityInExternalSystem =
    arvio['allow-visibility-in-external-system'] !== false

  const options = groupOptions.flatMap((spec) => [
    <input
      id={spec.htmlId}
      key={spec.htmlId}
      type="radio"
      name="allow-visibility-in-external-system"
      value={String(spec.value)}
      onChange={onHakemusAllowVisibilityInExternalSystem}
      checked={spec.value === selectedAllowVisibilityInExternalSystem}
      disabled={!allowEditing}
    />,
    <label key={spec.htmlId + '-label'} data-test-id={spec.testId} htmlFor={spec.htmlId}>
      {spec.label}
    </label>,
  ])
  return (
    <div id="set-allow-visibility-in-external-system">
      <h3>
        Salli näkyvyys ulkoisessa järjestelmässä:
        <HelpTooltip
          textKey="hankkeen_sivu__seuranta___salli_näkyvyys_ulkoisessa_järjestelmässä"
          direction={'salli-nakyvyys'}
        />
      </h3>
      <fieldset className="soresu-radiobutton-group">{options}</fieldset>
    </div>
  )
}

export default AllowVisibilityInExternalSystem
