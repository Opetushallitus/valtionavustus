import React from 'react'
import ComponentFactory from '../ComponentFactory.js'
import BasicTextField from './BasicTextField.jsx'
import BasicTextArea from './BasicTextArea.jsx'
import EmailTextField from './EmailTextField.jsx'
import MoneyTextField from './MoneyTextField.jsx'
import Dropdown from './Dropdown.jsx'
import RadioButton from './RadioButton.jsx'
import TextButton from './TextButton.jsx'
import {TextFieldPropertyMapper, OptionFieldPropertyMapper, ButtonPropertyMapper} from './PropertyMapper.js'

export default class FormComponent extends React.Component {
  constructor(props) {
    super(props)
    const fieldTypeMapping = {
      "textField": BasicTextField,
      "textArea": BasicTextArea,
      "emailField": EmailTextField,
      "moneyField": MoneyTextField,
      "dropdown": Dropdown,
      "radioButton": RadioButton,
      "textButton": TextButton
    }
    this.fieldPropertyMapping = {
      "textField": TextFieldPropertyMapper,
      "textArea": TextFieldPropertyMapper,
      "emailField": TextFieldPropertyMapper,
      "moneyField": TextFieldPropertyMapper,
      "dropdown": OptionFieldPropertyMapper,
      "radioButton": OptionFieldPropertyMapper,
      "textButton": ButtonPropertyMapper
    }
    this.componentFactory = new ComponentFactory(fieldTypeMapping)
  }

  render() {
    const controller = this.props.controller
    const fieldType = this.props.fieldType

    if (fieldType in controller.getCustomComponentTypeMapping()) {
      return controller.createCustomComponent(this.props)
    } else {
      if (fieldType in this.fieldPropertyMapping) {
        return this.componentFactory.createComponent(this.fieldPropertyMapping[fieldType].map(this.props))
      }
      return this.componentFactory.createComponent(this.props)
    }
  }
}
