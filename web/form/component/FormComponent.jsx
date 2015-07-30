import React from 'react'
import ComponentFactory from '../ComponentFactory.js'
import BasicTextField from './BasicTextField.jsx'
import BasicTextArea from './BasicTextArea.jsx'
import EmailTextField from './EmailTextField.jsx'
import MoneyTextField from './MoneyTextField.jsx'
import Dropdown from './Dropdown.jsx'
import RadioButton from './RadioButton.jsx'
import {TextFieldPropertyMapper} from './PropertyMapper.js'

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
      if(fieldType == "textField" || fieldType == "emailField" || fieldType == "moneyField") {
        var componentProps = TextFieldPropertyMapper.map(this.props)
        return this.componentFactory.createComponent(componentProps)
      }
      return this.componentFactory.createComponent(this.props)
    }
  }
}
