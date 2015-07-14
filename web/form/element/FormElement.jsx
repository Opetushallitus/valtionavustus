import React from 'react'
import BasicTextField from './BasicTextField.jsx'
import BasicTextArea from './BasicTextArea.jsx'
import EmailTextField from './EmailTextField.jsx'
import MoneyTextField from './MoneyTextField.jsx'
import Dropdown from './Dropdown.jsx'
import RadioButton from './RadioButton.jsx'

export default class FormElement extends React.Component {
  constructor(props) {
    super(props)
    this.fieldTypeMapping = {
      "textField": BasicTextField,
      "textArea": BasicTextArea,
      "emailField": EmailTextField,
      "moneyField": MoneyTextField,
      "dropdown": Dropdown,
      "radioButton": RadioButton
    }
  }

  render() {
    const field = this.props.field
    const displayAs = field.displayAs
    var input = <span>{this.constructor.name} : Unsupported field type {displayAs}</span>

    if (displayAs in this.fieldTypeMapping) {
      input = React.createElement(this.fieldTypeMapping[displayAs], this.props)
    }
    return input
  }
}
