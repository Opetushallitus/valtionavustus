import React, { PropsWithChildren } from 'react'
import Select, { SingleValueProps, components, OptionProps, GroupBase } from 'react-select'
import { VaCodeValue } from '../types'

export type CodeType = 'operational-unit-id' | 'project-id'

export interface AutoCompleteCodeValueProps {
  codeType: CodeType
  updateValue: (option: VaCodeValue | null) => void
  codeOptions: VaCodeValue[]
  selectedValue?: VaCodeValue
  disabled: boolean
}

const colorDarkGray = 'rgb(153, 146, 144)'

export default function AutocompleteCodeValue(props: AutoCompleteCodeValueProps) {
  const { codeType, selectedValue, disabled, updateValue, codeOptions } = props

  const getOptionValue = (option: VaCodeValue) => `${option.code} ${option['code-value']}`

  return (
    <Select
      classNamePrefix={`code-value-dropdown-${codeType}`}
      getOptionLabel={getOptionValue}
      placeholder={
        codeType === 'project-id'
          ? 'Syötä projektikoodi tai valitse "Ei projektikoodia"'
          : 'Valitse listasta'
      }
      options={codeOptions}
      onChange={updateValue}
      isMulti={false}
      styles={{
        singleValue: (base, { data }) => ({
          ...base,
          whiteSpace: 'normal',
          color: data.hidden ? colorDarkGray : base.color,
        }),
        option: (base, { data }) => ({
          ...base,
          color: data.hidden ? colorDarkGray : base.color,
        }),
      }}
      noOptionsMessage={() => 'Ei hakutuloksia'}
      getOptionValue={getOptionValue}
      isDisabled={disabled}
      value={selectedValue}
      backspaceRemovesValue={true}
      isOptionDisabled={(option) => Boolean(option.hidden)}
      components={{ Option, SingleValue }}
    />
  )
}

export function Option({
  children,
  ...props
}: PropsWithChildren<OptionProps<VaCodeValue, false, GroupBase<VaCodeValue>>>) {
  const { data, innerProps } = props
  // add data-test-id to component
  const propsWithDataTestId = Object.assign({}, innerProps, {
    'data-test-id': data.code,
  })
  return (
    // @ts-expect-error type error with react 19 types, seems to work otherwise
    <components.Option {...props} innerProps={propsWithDataTestId}>
      {children}
    </components.Option>
  )
}

function SingleValue({
  children,
  ...props
}: PropsWithChildren<SingleValueProps<VaCodeValue, false, GroupBase<VaCodeValue>>>) {
  const { data, innerProps } = props
  // add data-test-id to component
  const propsWithDataTestId = Object.assign({}, innerProps, {
    'data-test-id': `singlevalue-${data['value-type']}`,
  })
  return (
    // @ts-expect-error type error with react 19 types, seems to work otherwise
    <components.SingleValue {...props} innerProps={propsWithDataTestId}>
      {children}
    </components.SingleValue>
  )
}
