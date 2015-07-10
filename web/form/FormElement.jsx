import React from 'react'
import BasicTextField from './element/BasicTextField.jsx'
import BasicTextArea from './element/BasicTextArea.jsx'
import EmailTextField from './element/EmailTextField.jsx'
import Dropdown from './element/Dropdown.jsx'
import RadioButton from './element/RadioButton.jsx'

export default class FormElement extends React.Component {
  constructor(props) {
    super(props)
    this.fieldTypeMapping = {
      "textField": BasicTextField,
      "textArea": BasicTextArea,
      "emailField": EmailTextField,
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
