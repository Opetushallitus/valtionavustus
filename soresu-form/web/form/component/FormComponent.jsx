import React from 'react'

import ComponentFactory from '../ComponentFactory'

import BasicTextField from './BasicTextField'
import BasicTextArea from './BasicTextArea'
import EmailTextField from './EmailTextField'
import MoneyTextField from './MoneyTextField'
import IntegerTextField from './IntegerTextField'
import DecimalTextField from './DecimalTextField'
import FinnishBusinessIdTextField from './FinnishBusinessIdTextField'
import IbanTextField from './IbanTextField'
import BicTextField from './BicTextField'
import Dropdown from './Dropdown'
import RadioButton from './RadioButton'
import CheckboxButton from './CheckboxButton'
import AttachmentField from './AttachmentField'
import KoodistoField from './KoodistoField'
import TableField from './TableField'
import {
  TextFieldPropertyMapper,
  TrimmingTextFieldPropertyMapper,
  UpperCaseTextFieldPropertyMapper,
  OptionFieldPropertyMapper,
  RadioButtonPropertyMapper,
  DropdownFieldPropertyMapper,
  MultipleOptionFieldOnChangePropertyMapper,
  AttachmentFieldPropertyMapper,
  KoodistoFieldPropertyMapper,
} from './PropertyMapper'
import TableFieldPropertyMapper from './TableFieldPropertyMapper'
import MoneyValue from 'soresu-form/web/form/preview/MoneyValue'

export default class FormComponent extends React.Component {
  constructor(props) {
    super(props)
    const fieldTypeMapping = {
      textField: BasicTextField,
      textArea: BasicTextArea,
      nameField: BasicTextField,
      emailField: EmailTextField,
      moneyField: MoneyTextField,
      fixedMultiplierMoneyField: MoneyValue,
      fixedMultiplierField: MoneyTextField,
      integerField: IntegerTextField,
      decimalField: DecimalTextField,
      finnishBusinessIdField: FinnishBusinessIdTextField,
      ownershipType: RadioButton,
      iban: IbanTextField,
      bic: BicTextField,
      dropdown: Dropdown,
      radioButton: RadioButton,
      checkboxButton: CheckboxButton,
      namedAttachment: AttachmentField,
      koodistoField: KoodistoField,
      tableField: TableField,
    }
    const fieldPropertyMapperMapping = {
      textField: TextFieldPropertyMapper,
      textArea: TextFieldPropertyMapper,
      nameField: TextFieldPropertyMapper,
      emailField: TrimmingTextFieldPropertyMapper,
      moneyField: TextFieldPropertyMapper,
      fixedMultiplierMoneyField: TextFieldPropertyMapper,
      fixedMultiplierField: TextFieldPropertyMapper,
      integerField: TextFieldPropertyMapper,
      decimalField: TextFieldPropertyMapper,
      finnishBusinessIdField: TextFieldPropertyMapper,
      ownershipType: OptionFieldPropertyMapper,
      iban: UpperCaseTextFieldPropertyMapper,
      bic: UpperCaseTextFieldPropertyMapper,
      dropdown: DropdownFieldPropertyMapper,
      radioButton: RadioButtonPropertyMapper,
      checkboxButton: MultipleOptionFieldOnChangePropertyMapper,
      namedAttachment: AttachmentFieldPropertyMapper,
      koodistoField: KoodistoFieldPropertyMapper,
      tableField: TableFieldPropertyMapper,
    }
    this.componentFactory = new ComponentFactory({
      fieldTypeMapping: fieldTypeMapping,
      fieldPropertyMapperMapping: fieldPropertyMapperMapping,
    })
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
