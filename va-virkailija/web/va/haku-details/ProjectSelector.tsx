import React from 'react'
import { VaCodeValue } from '../types'
import AutoCompleteCodeValue from './AutoCompleteCodeValue'
import { IconAdd, IconRemove } from '../koodienhallinta/IconButton'

export interface ProjectSelectorProps {
  updateValue: (option: VaCodeValue | null) => void
  codeOptions: VaCodeValue[]
  selectedValue?: VaCodeValue
  disabled: boolean
  addRow?: () => void
  removeRow?: () => void
}

export default function ProjectSelector({
  codeOptions,
  disabled,
  selectedValue,
  updateValue,
  addRow,
  removeRow,
}: ProjectSelectorProps) {
  return (
    <div
      data-test-id={`projekti-valitsin-${selectedValue ? selectedValue.code : 'initial'}`}
      className="projekti-valitsin"
    >
      <AutoCompleteCodeValue
        codeType="project-id"
        codeOptions={codeOptions.filter((k) => k['value-type'] === 'project')}
        selectedValue={selectedValue}
        disabled={disabled}
        updateValue={updateValue}
      />
      {addRow && (
        <button
          disabled={disabled}
          data-test-id={`lisaa-projekti-${selectedValue ? selectedValue.code : 'initial'}`}
          className="lisaa-projekti projekti-nappula"
          onClick={addRow}
        >
          <IconAdd />
        </button>
      )}
      {removeRow && (
        <button
          disabled={disabled}
          className="poista-projekti projekti-nappula"
          onClick={removeRow}
        >
          <IconRemove />
        </button>
      )}
    </div>
  )
}
