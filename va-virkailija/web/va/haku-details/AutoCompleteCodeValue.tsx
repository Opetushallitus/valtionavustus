import React, {CSSProperties} from 'react'
import Select from 'react-select'
import HakujenHallintaController, {Avustushaku} from '../HakujenHallintaController'
import {VaCodeValue} from '../types'

type CodeType = 'operational-unit-id' | 'project-id' | 'operation-id'

interface AutoCompleteCodeValueProps {
  id: CodeType
  codeType: CodeType
  controller: HakujenHallintaController
  avustushaku: Avustushaku
  codeOptions: VaCodeValue[]
  selectedValue: VaCodeValue | ''
}

export default function AutocompleteCodeValue(props: AutoCompleteCodeValueProps) {
  const {controller, avustushaku, id, codeType, codeOptions, selectedValue} = props
  const updateValue = (option: VaCodeValue | null) => {
    if (option == null) {
      controller.onChangeListener(avustushaku, {id}, null)
      avustushaku[codeType] = null
    } else {
      controller.onChangeListener(avustushaku, {id}, option.id)
      avustushaku[codeType] = option.id
    }
  }

  const getOptionValue = (option: VaCodeValue) => `${option.code} ${option["code-value"]}`

  return (
    <Select
      getOptionLabel={() => 'code'}
      placeholder="Valitse listasta"
      options={codeOptions}
      onChange={updateValue}
      getOptionValue={getOptionValue}
      value={selectedValue as VaCodeValue}
      backspaceRemovesValue={true}
      isOptionDisabled={(option => Boolean(option.hidden))}
      components={{ Option, SingleValue, NoOptionsMessage }}
    />
  )
}

interface OptionProps extends SingleValueProps {
  selectOption: (data: VaCodeValue) => void
  style?: CSSProperties
}

function Option({data, selectOption, style}: OptionProps) {
  const classNames = Boolean(data.hidden) ?
      'Select-input name-option-renderer code-value-renderer disabled' :
      'Select-input name-option-renderer code-value-renderer'

  const onChange = () => selectOption(data)

  return (
    <div
      className={classNames}
      style={style}
      onClick={onChange}
      data-test-id={data.code}>
      <span>{data.code}</span>
      <span>{data["code-value"]}</span>
    </div>
  )
}

interface SingleValueProps {
  data: VaCodeValue
}

function SingleValue({ data }: SingleValueProps) {
  const classNames = Boolean(data.hidden) ? 'code-value-renderer disabled' : 'code-value-renderer'

  return (
    <div className={classNames} data-test-id={`singlevalue-${data["value-type"]}`}>
      <span>{data.code}</span>
      <span>{data["code-value"]}</span>
    </div>
  )
}

function NoOptionsMessage(_props: any) {
  return (
    <span data-test-id="code-value-dropdown__no-options">
      Ei hakutuloksia
    </span>
  )
}
