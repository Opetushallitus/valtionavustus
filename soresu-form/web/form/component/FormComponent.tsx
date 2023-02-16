import ComponentFactory from "../ComponentFactory";

import BasicTextField from "./BasicTextField";
import BasicTextArea from "./BasicTextArea";
import EmailTextField from "./EmailTextField";
import MoneyTextField from "./MoneyTextField";
import IntegerTextField from "./IntegerTextField";
import DecimalTextField from "./DecimalTextField";
import FinnishBusinessIdTextField from "./FinnishBusinessIdTextField";
import IbanTextField from "./IbanTextField";
import BicTextField from "./BicTextField";
import Dropdown from "./Dropdown";
import RadioButton from "./RadioButton";
import CheckboxButton from "./CheckboxButton";
import AttachmentField from "./AttachmentField";
import KoodistoField from "./KoodistoField";
import TableField from "./TableField";
import {
  TextFieldPropertyMapper,
  TrimmingTextFieldPropertyMapper,
  UpperCaseTextFieldPropertyMapper,
  OptionFieldPropertyMapper,
  DropdownFieldPropertyMapper,
  MultipleOptionFieldOnChangePropertyMapper,
  AttachmentFieldPropertyMapper,
  KoodistoFieldPropertyMapper,
} from "./PropertyMapper";
import TableFieldPropertyMapper from "./TableFieldPropertyMapper";
import { FieldType } from "../../va/types";

export default function FormComponent(props: {
  controller: any;
  fieldType: FieldType;
  htmlId: string;
}) {
  const controller = props.controller;
  const fieldType = props.fieldType;
  const fieldTypeMapping = {
    textField: BasicTextField,
    textArea: BasicTextArea,
    nameField: BasicTextField,
    emailField: EmailTextField,
    moneyField: MoneyTextField,
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
  };
  const fieldPropertyMapperMapping = {
    textField: TextFieldPropertyMapper,
    textArea: TextFieldPropertyMapper,
    nameField: TextFieldPropertyMapper,
    emailField: TrimmingTextFieldPropertyMapper,
    moneyField: TextFieldPropertyMapper,
    integerField: TextFieldPropertyMapper,
    decimalField: TextFieldPropertyMapper,
    finnishBusinessIdField: TextFieldPropertyMapper,
    ownershipType: OptionFieldPropertyMapper,
    iban: UpperCaseTextFieldPropertyMapper,
    bic: UpperCaseTextFieldPropertyMapper,
    dropdown: DropdownFieldPropertyMapper,
    radioButton: OptionFieldPropertyMapper,
    checkboxButton: MultipleOptionFieldOnChangePropertyMapper,
    namedAttachment: AttachmentFieldPropertyMapper,
    koodistoField: KoodistoFieldPropertyMapper,
    tableField: TableFieldPropertyMapper,
  };
  const componentFactory = new ComponentFactory({
    fieldTypeMapping: fieldTypeMapping,
    fieldPropertyMapperMapping: fieldPropertyMapperMapping,
  });

  if (fieldType in controller.getCustomComponentTypeMapping()) {
    return controller.createCustomComponent(props);
  }
  return componentFactory.createComponent(props);
}
