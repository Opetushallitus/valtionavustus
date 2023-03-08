import React from 'react'
import HelpTooltip from '../HelpTooltip'
import { Hakemus } from 'soresu-form/web/va/types'
import { useHakemustenArviointiDispatch } from '../hakemustenArviointi/arviointiStore'
import { setArvioValue, startHakemusArvioAutoSave } from '../hakemustenArviointi/arviointiReducer'

interface Props {
  hakemus: Hakemus
  allowEditing: boolean
  helpText: string
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

const AllowVisibilityInExternalSystem = ({ hakemus, allowEditing, helpText }: Props) => {
  const dispatch = useHakemustenArviointiDispatch()
  const onHakemusAllowVisibilityInExternalSystem = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(
      setArvioValue({
        hakemusId: hakemus.id,
        key: 'allow-visibility-in-external-system',
        value: event.target.value === 'true',
      })
    )
    dispatch(startHakemusArvioAutoSave({ hakemusId: hakemus.id }))
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
        <HelpTooltip content={helpText} direction={'salli-nakyvyys'} />
      </h3>
      <fieldset className="soresu-radiobutton-group">{options}</fieldset>
    </div>
  )
}

export default AllowVisibilityInExternalSystem
