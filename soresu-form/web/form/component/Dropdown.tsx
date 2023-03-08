import React, { ChangeEventHandler } from 'react'
import ClassNames from 'classnames'

import DropdownList from 'react-widgets/DropdownList'
import 'react-widgets/styles.css'

import Translator from '../Translator'
import BasicFieldComponent, { BasicFieldComponentProps } from './BasicFieldComponent'

interface DropdownProps extends BasicFieldComponentProps {
  options: any
  onChange: ChangeEventHandler<any>
}

export default class Dropdown extends BasicFieldComponent<DropdownProps> {
  render() {
    const props = this.props

    const messages = {
      filterPlaceholder: '',
      emptyList: 'Ei vaihtoehtoja',
      emptyFilter: 'Ei tuloksia',
    }

    const optionToText = (option: any) =>
      option.value ? new Translator(option).translate('label', props.lang, option.value) : ''

    const OptionEntry = (props: any) => <span>{optionToText(props.item)}</span>

    const classStr = ClassNames('soresu-dropdown', {
      'soresu-dropdown-unselected': !props.value && !props.disabled && !props.hasError,
      error: props.hasError,
    })

    return (
      <div className={classStr}>
        {this.label()}
        <DropdownList
          id={props.htmlId}
          containerClassName="dropdown-list"
          name={props.htmlId}
          disabled={props.disabled}
          onChange={props.onChange}
          data={props.options}
          defaultValue={props.value}
          dataKey="value"
          textField={optionToText}
          renderValue={OptionEntry}
          filter="contains"
          messages={messages}
          onToggle={() => {}}
        />
      </div>
    )
  }
}
