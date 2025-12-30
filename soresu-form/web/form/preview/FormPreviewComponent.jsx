import React from 'react'
import ComponentFactory from '../ComponentFactory'
import BasicValue from './BasicValue'
import TextAreaValue from './TextAreaValue'
import MoneyValue from './MoneyValue'
import IntegerValue from './IntegerValue'
import DecimalValue from './DecimalValue'
import OptionValue from './OptionValue'
import MultipleOptionValue from './MultipleOptionValue'
import AttachmentPreview from './AttachmentPreview'
import TableValue from './TableValue'
import {
  TextFieldPropertyMapper,
  OptionFieldPropertyMapper,
  MultipleOptionFieldOnChangePropertyMapper,
  AttachmentDisplayPropertyMapper,
} from '../component/PropertyMapper'
import TableValuePropertyMapper from './TableValuePropertyMapper'

export default class FormPreviewComponent extends React.Component {
  constructor(props) {
    super(props)
    const fieldTypeMapping = {
      textField: BasicValue,
      textArea: TextAreaValue,
      nameField: BasicValue,
      emailField: BasicValue,
      moneyField: MoneyValue,
      fixedMultiplierMoneyField: MoneyValue,
      fixedMultiplierField: BasicValue,
      integerField: IntegerValue,
      decimalField: DecimalValue,
      finnishBusinessIdField: BasicValue,
      ownershipType: OptionValue,
      iban: BasicValue,
      bic: BasicValue,
      dropdown: OptionValue,
      radioButton: OptionValue,
      checkboxButton: MultipleOptionValue,
      namedAttachment: AttachmentPreview,
      tableField: TableValue,
    }

    const fieldPropertyMapping = {
      textField: TextFieldPropertyMapper,
      textArea: TextFieldPropertyMapper,
      nameField: TextFieldPropertyMapper,
      emailField: TextFieldPropertyMapper,
      moneyField: TextFieldPropertyMapper,
      fixedMultiplierMoneyField: TextFieldPropertyMapper,
      fixedMultiplierField: TextFieldPropertyMapper,
      integerField: TextFieldPropertyMapper,
      decimalField: TextFieldPropertyMapper,
      finnishBusinessIdField: TextFieldPropertyMapper,
      ownershipType: OptionFieldPropertyMapper,
      iban: TextFieldPropertyMapper,
      bic: TextFieldPropertyMapper,
      dropdown: OptionFieldPropertyMapper,
      radioButton: OptionFieldPropertyMapper,
      checkboxButton: MultipleOptionFieldOnChangePropertyMapper,
      namedAttachment: AttachmentDisplayPropertyMapper,
      tableField: TableValuePropertyMapper,
    }

    this.componentFactory = new ComponentFactory({
      fieldTypeMapping: fieldTypeMapping,
      fieldPropertyMapperMapping: fieldPropertyMapping,
    })
  }

  componentDidMount() {
    if (this.props.field && this.props.controller) {
      this.props.controller.componentDidMount(this.props.field, this.props.value)
    }
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
