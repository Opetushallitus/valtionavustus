export const fieldTypes: { [f in AddableFieldType]: FieldClass } = {
  textField: "formField",
  textArea: "formField",
  radioButton: "formField",
  checkboxButton: "formField",
  dropdown: "formField",
  namedAttachment: "formField",
  koodistoField: "formField",
  p: "infoElement",
  h1: "infoElement",
  h3: "infoElement",
  link: "infoElement",
  theme: "wrapperElement",
  fieldset: "wrapperElement",
  growingFieldset: "wrapperElement",
  growingFieldsetChild: "wrapperElement",
};

const addableInfoElementFields = ["h1", "h3", "link", "p"] as const;

const nonAddableInfoElementFields = [
  "endOfDateRange",
  "bulletList",
  "vaTraineeDayTotalCalculator",
  "vaBudgetGrantedElement",
] as const;

type InfoElementFieldTypes =
  | typeof addableInfoElementFields[number]
  | typeof nonAddableInfoElementFields[number];

export const addableFields = [
  "textField",
  "textArea",
  "radioButton",
  "checkboxButton",
  "dropdown",
  "namedAttachment",
  "koodistoField",
  "theme",
  "fieldset",
  "growingFieldset",
  "growingFieldsetChild",
  ...addableInfoElementFields,
] as const;
export type AddableFieldType = typeof addableFields[number];

const nonAddableFormElementTypes = [
  "moneyField",
  "emailField",
  "bic",
  "iban",
  "tableField",
  "integerField",
  "decimalField",
  "finnishBusinessIdField",
  "vaEmailNotification",
  "vaFocusAreas",
  "vaEmailNotification",
  "vaSelfFinancingField",
  "vaTraineeDayCalculator",
] as const;
type NonAddableFormElement = typeof nonAddableFormElementTypes[number];
export type NonAddableFieldType =
  | NonAddableFormElement
  | typeof nonAddableInfoElementFields[number];

export type BudgetFieldType =
  | "vaBudget"
  | "vaBudgetSummaryElement"
  | "vaSelfFinancingField"
  | "vaBudgetItemElement"
  | "vaTraineeDayCalculator"
  | "vaSummingBudgetElement"
  | "vaProjectDescription";
export type FieldType =
  | AddableFieldType
  | NonAddableFieldType
  | BudgetFieldType;
export type FieldClass = "formField" | "infoElement" | "wrapperElement";

export interface Option {
  value: string;
  label: LocalizedText;
}

interface BaseField<FieldClass extends string, FieldType extends string> {
  fieldClass: FieldClass;
  id: string;
  required: boolean;
  fieldType: FieldType;
}

type LocalizedText = {
  fi: string;
  sv: string;
};

export interface FormField
  extends BaseField<"formField", AddableFieldType | NonAddableFormElement> {
  label?: LocalizedText;
  helpText: LocalizedText;
  initialValue?: number | LocalizedText;
  params?: any;
  options?: Option[];
}

export interface InfoElement
  extends BaseField<"infoElement", InfoElementFieldTypes> {
  params?: any;
  label?: LocalizedText;
  text?: LocalizedText;
}

interface Button {
  fieldClass: "button";
  id: string;
  label?: LocalizedText;
  params?: any;
  fieldType: string;
}

type BasicElement = FormField | InfoElement | Button;

export interface WrapperElement extends BaseField<"wrapperElement", any> {
  children?: (WrapperElement | BasicElement)[];
  params?: any;
  label?: LocalizedText;
  helpText?: LocalizedText;
}

export type Field = WrapperElement | BasicElement;

type Rule = {
  type: string;
  triggerId: string;
  targetIds: string[];
  params?: any;
};

export interface Form {
  content: Field[];
  rules: Rule[];
  created_at: Date;
  updated_at: Date;
  validationErrors?: any;
}
