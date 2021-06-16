import React from 'react'
import ClassNames from 'classnames'

import DropdownList from 'react-widgets/DropdownList'
import 'react-widgets/styles.css'

import Translator from '../Translator'
import BasicFieldComponent from './BasicFieldComponent.jsx'

export default class Dropdown extends BasicFieldComponent {
  render() {
    const props = this.props

    const messages = {
      filterPlaceholder: '',
      emptyList: 'Ei vaihtoehtoja',
      emptyFilter: 'Ei tuloksia'
    }

    const optionToText = option =>
      option.value
        ? new Translator(option).translate("label", props.lang, option.value)
        : ""

    const OptionEntry = props => <span>{optionToText(props.item)}</span>

    const classStr = ClassNames("soresu-dropdown", {
      "soresu-dropdown-unselected": !props.value && !props.disabled && !props.hasError,
      error: props.hasError
    })

    return (
      <div className={classStr}>
        {this.label()}
        <DropdownList id={props.htmlId}
                      containerClassName="dropdown-list"
                      name={props.htmlId}
                      disabled={props.disabled}
                      onChange={props.onChange}
                      data={props.options}
                      defaultValue={props.value}
                      dataKey="value"
                      textField={optionToText}
                      renderValue={OptionEntry}
                      filter='contains'
                      messages={messages}
                      onToggle={null}/>
      </div>
    )
  }
}
