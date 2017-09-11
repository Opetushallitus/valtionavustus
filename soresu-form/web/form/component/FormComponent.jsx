import React from 'react'

import ComponentFactory from '../ComponentFactory.jsx'

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
import KoodistoField from './KoodistoField.jsx'
import TableField from './TableField.jsx'
import {
  TextFieldPropertyMapper,
  TrimmingTextFieldPropertyMapper,
  UpperCaseTextFieldPropertyMapper,
  OptionFieldPropertyMapper,
  DropdownFieldPropertyMapper,
  MultipleOptionFieldOnChangePropertyMapper,
  ButtonPropertyMapper,
  AttachmentFieldPropertyMapper,
  KoodistoFieldPropertyMapper,
} from './PropertyMapper'
import TableFieldPropertyMapper from './TableFieldPropertyMapper'

export default class FormComponent extends React.Component {
  constructor(props) {
    super(props)
    const fieldTypeMapping = {
      "textField": BasicTextField,
      "textArea": BasicTextArea,
      "nameField": BasicTextField,
      "emailField": EmailTextField,
      "moneyField": MoneyTextField,
      "finnishBusinessIdField": FinnishBusinessIdTextField,
      "iban": IbanTextField,
      "bic": BicTextField,
      "dropdown": Dropdown,
      "radioButton": RadioButton,
      "checkboxButton": CheckboxButton,
      "namedAttachment": AttachmentField,
      "koodistoField": KoodistoField,
      "tableField": TableField
    }
    const fieldPropertyMapperMapping = {
      "textField": TextFieldPropertyMapper,
      "textArea": TextFieldPropertyMapper,
      "nameField": TextFieldPropertyMapper,
      "emailField": TrimmingTextFieldPropertyMapper,
      "moneyField": TextFieldPropertyMapper,
      "finnishBusinessIdField": TextFieldPropertyMapper,
      "iban": UpperCaseTextFieldPropertyMapper,
      "bic": UpperCaseTextFieldPropertyMapper,
      "dropdown": DropdownFieldPropertyMapper,
      "radioButton": OptionFieldPropertyMapper,
      "checkboxButton": MultipleOptionFieldOnChangePropertyMapper,
      "namedAttachment": AttachmentFieldPropertyMapper,
      "koodistoField": KoodistoFieldPropertyMapper,
      "tableField": TableFieldPropertyMapper
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
