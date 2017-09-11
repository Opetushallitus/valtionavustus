import React from 'react'
import ComponentFactory from '../ComponentFactory.jsx'
import BasicValue from './BasicValue.jsx'
import TextAreaValue from './TextAreaValue.jsx'
import MoneyValue from './MoneyValue.jsx'
import OptionValue from './OptionValue.jsx'
import MultipleOptionValue from './MultipleOptionValue.jsx'
import AttachmentPreview from './AttachmentPreview.jsx'
import TableValue from './TableValue.jsx'
import {
  TextFieldPropertyMapper,
  OptionFieldPropertyMapper,
  MultipleOptionFieldOnChangePropertyMapper,
  ButtonPropertyMapper,
  AttachmentDisplayPropertyMapper,
} from '../component/PropertyMapper'
import TableValuePropertyMapper from './TableValuePropertyMapper'

export default class FormPreviewComponent extends React.Component {
  constructor(props) {
    super(props)
    const fieldTypeMapping = {
      "textField": BasicValue,
      "textArea": TextAreaValue,
      "nameField": BasicValue,
      "emailField": BasicValue,
      "moneyField": MoneyValue,
      "finnishBusinessIdField": BasicValue,
      "iban": BasicValue,
      "bic": BasicValue,
      "dropdown": OptionValue,
      "radioButton": OptionValue,
      "checkboxButton": MultipleOptionValue,
      "namedAttachment": AttachmentPreview,
      "tableField": TableValue
    }

    const fieldPropertyMapping = {
      "textField": TextFieldPropertyMapper,
      "textArea": TextFieldPropertyMapper,
      "nameField": TextFieldPropertyMapper,
      "emailField": TextFieldPropertyMapper,
      "moneyField": TextFieldPropertyMapper,
      "finnishBusinessIdField": TextFieldPropertyMapper,
      "iban": TextFieldPropertyMapper,
      "bic": TextFieldPropertyMapper,
      "dropdown": OptionFieldPropertyMapper,
      "radioButton": OptionFieldPropertyMapper,
      "checkboxButton": MultipleOptionFieldOnChangePropertyMapper,
      "namedAttachment": AttachmentDisplayPropertyMapper,
      "tableField": TableValuePropertyMapper
    }

    this.componentFactory = new ComponentFactory({ fieldTypeMapping: fieldTypeMapping, fieldPropertyMapperMapping: fieldPropertyMapping})
  }

  render() {
    const fieldType = this.props.fieldType
    const controller = this.props.controller

    if (fieldType in controller.getCustomPreviewComponentTypeMapping()) {
      return controller.createCustomPreviewComponent(this.props)
    } else {
      return this.componentFactory.createComponent(this.props)
    }
  }
}
