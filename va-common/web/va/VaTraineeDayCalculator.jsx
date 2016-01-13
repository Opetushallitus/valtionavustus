import React from 'react'
import ClassNames from 'classnames'

import BasicFieldComponent from 'soresu-form/web/form/component/BasicFieldComponent.jsx'
import RadioButton from 'soresu-form/web/form/component/RadioButton.jsx'
import BasicTextField from 'soresu-form/web/form/component/BasicTextField.jsx'
import Translator from 'soresu-form/web/form/Translator'
import InputValueStorage from 'soresu-form/web/form/InputValueStorage'

// Koulutettavapäivälaskuri in finnish
export default class VaTraineeDayCalculator extends BasicFieldComponent {

  static subField(id) {
    const subFields = {
      "scope-type": {id: "scope-type", fieldType: "radioButton"},
      "scope": {id: "scope", fieldType: "textField"},
      "person-count": {id: "person-count", fieldType: "textField"},
      "total": {id: "total", fieldType: "textField"}
    }
    return subFields[id]
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

  static readTotalAsFloat(value) {
    return parseFloat(InputValueStorage.readValue({}, value, "total").replace(",", "."))
  }

  static validateTotal(field, value) {
    const total =  VaTraineeDayCalculator.readTotalAsFloat(value)
    return total > 0 ? undefined : { "error": "negative-trayneeday-total" }
  }

  render() {
    const props = this.props
    const htmlId = props.htmlId
    const valueHolder = {value: this.props.value ? this.props.value : [
      {key:"scope-type", value: "op", fieldType: "radioButton"},
      {key:"scope", value: "0", fieldType: "textField"},
      {key:"person-count", value: "0", fieldType: "textField"},
      {key:"total", value: "0", fieldType: "textField"}]}

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
    const onChange = (field) => {
      return (event) => {
        var value = event.target.value
        var scopeValue = InputValueStorage.readValue({}, valueHolder, "scope")
        var personCountValue = InputValueStorage.readValue({}, valueHolder, "person-count")
        if(event.target.id.endsWith("scope")) {
          value =  VaTraineeDayCalculator.formatFloatString(value)
          scopeValue = value
        }
        if(event.target.id.endsWith("person-count")) {
          value = parseInt(value) ? parseInt(value).toString() : ""
          personCountValue = value
        }
        const fieldUpdate = {
          id: field.id,
          field: field,
          value: value
        }
        InputValueStorage.writeValue({}, valueHolder, fieldUpdate)
        const scopeMultiplier = InputValueStorage.readValue({}, valueHolder, "scope-type") === "op" ? 4.5 : 1
        const scope = parseFloat(scopeValue.replace(",", ".")) ? parseFloat(scopeValue.replace(",", ".")) : 0
        const personCount = parseInt(personCountValue) ? parseInt(personCountValue) : 0
        const totalUpdate = {
          id: "total",
          field: VaTraineeDayCalculator.subField("total"),
          value: VaTraineeDayCalculator.formatFloat(scopeMultiplier * scope * personCount)
        }
        InputValueStorage.writeValue({}, valueHolder, totalUpdate)
        props.onChange({"target": {"value": valueHolder.value}})
      }
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
                         onChange={onChange(VaTraineeDayCalculator.subField("scope-type"))}
                         value={InputValueStorage.readValue({}, valueHolder, "scope-type")}
                         translations={{}}
                         lang={this.props.lang} />
          </td>
          <td>
            <BasicTextField htmlId={htmlId + ".scope"}
                            disabled={props.disabled}
                            onChange={onChange(VaTraineeDayCalculator.subField("scope"))}
                            value={InputValueStorage.readValue({}, valueHolder, "scope")}
                            translations={{}}
                            hasError={props.hasError}
                            size="extra-extra-small"
                            lang={this.props.lang} />
          </td>
          <td>
            <BasicTextField htmlId={htmlId + ".person-count"}
                            disabled={props.disabled}
                            onChange={onChange(VaTraineeDayCalculator.subField("person-count"))}
                            value={InputValueStorage.readValue({}, valueHolder, "person-count")}
                            translations={{}}
                            hasError={props.hasError}
                            size="extra-extra-small"
                            lang={this.props.lang} />
            </td>
        </tr></tbody>
        <tfoot>
        <tr><td colSpan="3">{this.label(totalClassStr)}: {InputValueStorage.readValue({}, valueHolder, "total")}</td></tr>
        </tfoot>
      </table>
      </div>
    )
  }
}
