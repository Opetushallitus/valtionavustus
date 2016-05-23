import React from 'react'
import ClassNames from 'classnames'
import _ from 'lodash'

import BasicFieldComponent from 'soresu-form/web/form/component/BasicFieldComponent.jsx'
import RadioButton from 'soresu-form/web/form/component/RadioButton.jsx'
import BasicTextField from 'soresu-form/web/form/component/BasicTextField.jsx'
import Translator from 'soresu-form/web/form/Translator'
import InputValueStorage from 'soresu-form/web/form/InputValueStorage'

// Koulutettavapäivälaskuri in finnish
export default class VaTraineeDayCalculator extends BasicFieldComponent {

  static subField(field, type) {
    const subFields = {
      "scope-type": {id: field.id + ".scope-type", fieldType: "radioButton"},
      "scope": {id: field.id + ".scope", fieldType: "textField"},
      "person-count": {id: field.id + ".person-count", fieldType: "textField"},
      "total": {id: field.id + ".total", fieldType: "textField"}
    }
    return subFields[type]
  }

  static emptyValue(field) {
    return [{key: field.id + ".scope-type", value: "op", fieldType: "radioButton"},
            {key: field.id + ".scope", value: "0", fieldType: "textField"},
            {key: field.id + ".person-count", value: "0", fieldType: "textField"},
            {key: field.id + ".total", value: "0", fieldType: "textField"}]
  }

  constructor(props) {
    super(props)
    this.translator = new Translator(props.translations.form["trainee-day-calculator"])
  }

  resolveClassName(className) {
    const classNames = ClassNames(className, { error: this.props.hasError })
    return !_.isEmpty(classNames) ? classNames : undefined
  }

  static formatFloat(floatValue) {
    return floatValue ? floatValue.toFixed(1).replace(".", ",") : "0"
  }

  static formatFloatString(stringValue) {
    const sanitizedString = stringValue.replace(".", ",").replace(/[^\d,]/g, "")
    if(sanitizedString.indexOf(",") < 0 || sanitizedString.endsWith(",")) {
      return sanitizedString
    }
    const floatValue = parseFloat(sanitizedString.replace(",", "."))
    return VaTraineeDayCalculator.formatFloat(floatValue)
  }

  static formatIntString(stringValue) {
    if(stringValue === "") {
      return stringValue
    }
    const intValue = parseInt(stringValue)
    return intValue ? intValue.toString() : "0"
  }

  static readSubValue(value, fieldId, type) {
    return InputValueStorage.readValue({}, value, fieldId + "." + type)
  }

  static readTotalAsFloat(fieldId, value) {
    return parseFloat(VaTraineeDayCalculator.readSubValue(value, fieldId, "total").replace(",", "."))
  }

  static validateTotal(field, value) {
    _.forEach(value, answer => {
      if(answer.key && !_.startsWith(answer.key, field.id)) {
        const subType = answer.key.substr(answer.key.lastIndexOf(".") + 1)
        answer.key = field.id + "." + subType
      }
    })
    const total =  VaTraineeDayCalculator.readTotalAsFloat(field.id, value)
      return total > 0 ? undefined : { "error": "negative-trayneeday-total" }
  }

  static onChange(subField,props,valueHolder,field) {
    return (event) => {
      var value = event.target.value
      var scopeValue = VaTraineeDayCalculator.readSubValue(valueHolder, field.id, "scope")
      var personCountValue = VaTraineeDayCalculator.readSubValue(valueHolder, field.id, "person-count")
      if(event.target.id.endsWith("scope")) {
        value =  VaTraineeDayCalculator.formatFloatString(value)
        scopeValue = value
      }
      if(event.target.id.endsWith("person-count")) {
        value = VaTraineeDayCalculator.formatIntString(value)
        personCountValue = value
      }
      const fieldUpdate = {
        id: subField.id,
        field: subField,
        value: value
      }
      InputValueStorage.writeValue({}, valueHolder, fieldUpdate)
      const scopeMultiplier = VaTraineeDayCalculator.readSubValue(valueHolder, field.id, "scope-type") === "op" ? 4.5 : 1
      const scope = parseFloat(scopeValue.replace(",", ".")) ? parseFloat(scopeValue.replace(",", ".")) : 0
      const personCount = parseInt(personCountValue) ? parseInt(personCountValue) : 0
      const totalUpdate = {
        id: field.id + "." +"total",
        field: VaTraineeDayCalculator.subField(field, "total"),
        value: VaTraineeDayCalculator.formatFloat(scopeMultiplier * scope * personCount)
      }
      InputValueStorage.writeValue({}, valueHolder, totalUpdate)
      props.onChange({"target": {"value": valueHolder.value}})
    }
  }

  render() {
    const props = this.props
    const htmlId = props.htmlId
    const field = props.field
    const valueHolder = {value: this.props.value ? this.props.value : VaTraineeDayCalculator.emptyValue(field)}
    const scopeTypeOptions = [
      {
        "value": "op",
        "label": {
          "fi": this.translator.translate("op", "fi"),
          "sv": this.translator.translate("op", "sv")
        }
      },
      {
        "value": "kp",
        "label": {
          "fi": this.translator.translate("kp", "fi"),
          "sv": this.translator.translate("kp", "sv")
        }
      }
    ]
    const onChange = (subField) => {
      return VaTraineeDayCalculator.onChange(subField,props,valueHolder,field)
    }
    const totalClassStr = this.resolveClassName("total")
    return (
      <div id={htmlId} className="va-trainee-day-calculator">
        <table>
        <thead><tr>
          <th>{this.translator.translate("scope-type", this.props.lang)}</th>
          <th>{this.translator.translate("scope", this.props.lang)}</th>
          <th>{this.translator.translate("person-count", this.props.lang)}</th>
        </tr></thead>
        <tbody><tr>
          <td>
            <RadioButton htmlId={htmlId + ".scope-type"}
                         options={scopeTypeOptions}
                         disabled={props.disabled}
                         onChange={onChange(VaTraineeDayCalculator.subField(field, "scope-type"))}
                         value={VaTraineeDayCalculator.readSubValue(valueHolder, field.id, "scope-type") }
                         translations={{}}
                         lang={this.props.lang} />
          </td>
          <td>
            <BasicTextField htmlId={htmlId + ".scope"}
                            disabled={props.disabled}
                            onChange={onChange(VaTraineeDayCalculator.subField(field, "scope"))}
                            value={VaTraineeDayCalculator.readSubValue(valueHolder, field.id, "scope") }
                            translations={{}}
                            hasError={props.hasError && !(parseFloat(VaTraineeDayCalculator.readSubValue(valueHolder, field.id, "scope").replace(",", ".")) > 0)}
                            size="extra-extra-small"
                            lang={this.props.lang} />
          </td>
          <td>
            <BasicTextField htmlId={htmlId + ".person-count"}
                            disabled={props.disabled}
                            onChange={onChange(VaTraineeDayCalculator.subField(field, "person-count"))}
                            value={VaTraineeDayCalculator.readSubValue(valueHolder, field.id, "person-count") }
                            translations={{}}
                            hasError={props.hasError && !(parseInt(VaTraineeDayCalculator.readSubValue(valueHolder, field.id, "person-count")) > 0)}
                            size="extra-extra-small"
                            lang={this.props.lang} />
            </td>
        </tr></tbody>
        <tfoot>
        <tr><td colSpan="3">{this.label(totalClassStr)}: {InputValueStorage.readValue({}, valueHolder, field.id + ".total")}</td></tr>
        </tfoot>
      </table>
      </div>
    )
  }
}

export class VaTraineeDayTotalCalculator extends React.Component {

  constructor(props) {
    super(props)
    this.translator = new Translator(props.translations.form["trainee-day-calculator"])
  }

  render() {
    const answers = this.props.answersObject
    const htmlId = this.props.htmlId
    const vaTraineeDayCalculatorAnswers = InputValueStorage.readValues(answers, "vaTraineeDayCalculator")
    const scopeTotal = _.reduce(vaTraineeDayCalculatorAnswers, (acc, answer) => {
      const subTotal = VaTraineeDayCalculator.readTotalAsFloat(answer.key, answer)
      return (subTotal ? subTotal: 0) + acc }, 0
    )
    const personCountTotal = _.reduce(vaTraineeDayCalculatorAnswers, (acc, answer) => {
      const subTotal = parseInt(VaTraineeDayCalculator.readSubValue(answer, answer.key, "person-count"))
      return (subTotal ? subTotal: 0) + acc }, 0
    )
    return (
      <div id={htmlId} className="va-trainee-day-calculator-total">
        <p><label className="total">{this.translator.translate("person-count-total", this.props.lang)}:</label> {personCountTotal}</p>
        <p><label className="total">{this.translator.translate("scope-total", this.props.lang)}:</label> {VaTraineeDayCalculator.formatFloat(scopeTotal)}</p>
      </div>
    )
  }
}
