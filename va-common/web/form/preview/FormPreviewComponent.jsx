import React from 'react'
import ComponentFactory from '../ComponentFactory.js'
import BasicValue from './BasicValue.jsx'
import TextAreaValue from './TextAreaValue.jsx'
import MoneyValue from './MoneyValue.jsx'
import OptionValue from './OptionValue.jsx'
import AttachmentPreview from './AttachmentPreview.jsx'
import { TextFieldPropertyMapper,
         OptionFieldPropertyMapper,
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
      "namedAttachment": AttachmentDisplayPropertyMapper
    }
  }

  render() {
    const fieldType = this.props.fieldType
    const props = this.fieldPropertyMapping[fieldType].map(this.props)
    return this.componentFactory.createComponent(props)
  }
}
