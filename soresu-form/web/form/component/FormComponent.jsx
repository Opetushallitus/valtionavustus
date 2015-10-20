import React from 'react'

import ComponentFactory from '../ComponentFactory'

import BasicTextField from './BasicTextField.jsx'
import BasicTextArea from './BasicTextArea.jsx'
import EmailTextField from './EmailTextField.jsx'
import MoneyTextField from './MoneyTextField.jsx'
import FinnishBusinessIdTextField from './FinnishBusinessIdTextField.jsx'
import IbanTextField from './IbanTextField.jsx'
import BicTextField from './BicTextField.jsx'
import Dropdown from './Dropdown.jsx'
import RadioButton from './RadioButton.jsx'
import CheckboxButton from './CheckboxButton.jsx'
import AttachmentField from './AttachmentField.jsx'
import { TextFieldPropertyMapper,
         OptionFieldPropertyMapper,
         MultipleOptionFieldOnChangePropertyMapper,
         ButtonPropertyMapper,
         AttachmentFieldPropertyMapper} from './PropertyMapper'

export default class FormComponent extends React.Component {
  constructor(props) {
    super(props)
    const fieldTypeMapping = {
      "textField": BasicTextField,
      "textArea": BasicTextArea,
      "emailField": EmailTextField,
      "moneyField": MoneyTextField,
      "finnishBusinessIdField": FinnishBusinessIdTextField,
      "iban": IbanTextField,
      "bic": BicTextField,
      "dropdown": Dropdown,
      "radioButton": RadioButton,
      "checkboxButton": CheckboxButton,
      "namedAttachment": AttachmentField
    }
    const fieldPropertyMapperMapping = {
      "textField": TextFieldPropertyMapper,
      "textArea": TextFieldPropertyMapper,
      "emailField": TextFieldPropertyMapper,
      "moneyField": TextFieldPropertyMapper,
      "finnishBusinessIdField": TextFieldPropertyMapper,
      "iban": TextFieldPropertyMapper,
      "bic": TextFieldPropertyMapper,
      "dropdown": OptionFieldPropertyMapper,
      "radioButton": OptionFieldPropertyMapper,
      "checkboxButton": MultipleOptionFieldOnChangePropertyMapper,
      "namedAttachment": AttachmentFieldPropertyMapper
    }
    this.componentFactory = new ComponentFactory({ fieldTypeMapping: fieldTypeMapping, fieldPropertyMapperMapping: fieldPropertyMapperMapping })
  }

  render() {
    const controller = this.props.controller
    const fieldType = this.props.fieldType

    if (fieldType in controller.getCustomComponentTypeMapping()) {
      return controller.createCustomComponent(this.props)
    } else {
      return this.componentFactory.createComponent(this.props)
    }
  }
}
