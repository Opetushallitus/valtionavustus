import React from 'react'
import ComponentFactory from '../ComponentFactory.js'
import BasicTextField from './BasicTextField.jsx'
import BasicTextArea from './BasicTextArea.jsx'
import EmailTextField from './EmailTextField.jsx'
import MoneyTextField from './MoneyTextField.jsx'
import Dropdown from './Dropdown.jsx'
import RadioButton from './RadioButton.jsx'
import {TextFieldPropertyMapper, OptionFieldPropertyMapper} from './PropertyMapper.js'

export default class FormComponent extends React.Component {
  constructor(props) {
    super(props)
    const fieldTypeMapping = {
      "textField": BasicTextField,
      "textArea": BasicTextArea,
      "emailField": EmailTextField,
      "moneyField": MoneyTextField,
      "dropdown": Dropdown,
      "radioButton": RadioButton
    }
    this.componentFactory = new ComponentFactory(fieldTypeMapping)
  }

  render() {
    const controller = this.props.controller
    const fieldType = this.props.fieldType

    if (fieldType in controller.getCustomComponentTypeMapping()) {
      return controller.createCustomComponent(this.props)
    } else {
      if (fieldType == "textField" || fieldType == "emailField" || fieldType == "moneyField" || fieldType == "textArea") {
        return this.componentFactory.createComponent(TextFieldPropertyMapper.map(this.props))
      } else if (fieldType == "radioButton") {
        return this.componentFactory.createComponent(OptionFieldPropertyMapper.map(this.props))
      }
      return this.componentFactory.createComponent(this.props)
    }
  }
}
