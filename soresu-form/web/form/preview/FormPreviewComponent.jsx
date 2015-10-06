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
