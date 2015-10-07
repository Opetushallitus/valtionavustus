import React from 'react'
import ComponentFactory from '../ComponentFactory.js'
import BasicValue from './BasicValue.jsx'
import TextAreaValue from './TextAreaValue.jsx'
import MoneyValue from './MoneyValue.jsx'
import OptionValue from './OptionValue.jsx'
import MultipleOptionValue from './MultipleOptionValue.jsx'
import AttachmentPreview from './AttachmentPreview.jsx'
import { TextFieldPropertyMapper,
         OptionFieldPropertyMapper,
         MultipleOptionFieldOnChangePropertyMapper,
         ButtonPropertyMapper,
  AttachmentDisplayPropertyMapper} from '../component/PropertyMapper.js'

export default class FormPreviewComponent extends React.Component {
  constructor(props) {
    super(props)
    const fieldTypeMapping = {
      "textField": BasicValue,
      "textArea": TextAreaValue,
      "emailField": BasicValue,
      "moneyField": MoneyValue,
      "finnishBusinessIdField": BasicValue,
      "iban": BasicValue,
      "bic": BasicValue,
      "dropdown": OptionValue,
      "radioButton": OptionValue,
      "checkboxButton": MultipleOptionValue,
      "namedAttachment": AttachmentPreview
    }
    this.componentFactory = new ComponentFactory(fieldTypeMapping)

    this.fieldPropertyMapping = {
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
      "namedAttachment": AttachmentDisplayPropertyMapper
    }
  }

  render() {
    const fieldType = this.props.fieldType
    const controller = this.props.controller

    if (fieldType in controller.getCustomPreviewComponentTypeMapping()) {
      return controller.createCustomPreviewComponent(this.props)
    } else {
      return this.componentFactory.createComponent(this.fieldPropertyMapping[fieldType].map(this.props))
    }
  }
}
