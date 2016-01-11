import React from 'react'
import ClassNames from 'classnames'

import BasicFieldComponent from 'soresu-form/web/form/component/BasicFieldComponent.jsx'
import RadioButton from 'soresu-form/web/form/component/RadioButton.jsx'
import BasicTextField from 'soresu-form/web/form/component/BasicTextField.jsx'
import Translator from 'soresu-form/web/form/Translator'
import InputValueStorage from 'soresu-form/web/form/InputValueStorage'

// Koulutettavapäivälaskuri in finnish
export default class VaTraineeDayCalculator extends BasicFieldComponent {
  constructor(props) {
    super(props)
    this.translator = new Translator(props.translations.form["trainee-day-calculator"])
  }

  resolveClassName(className) {
    const classNames = ClassNames(className, { error: this.props.hasError })
    return !_.isEmpty(classNames) ? classNames : undefined
  }

  render() {
    const props = this.props
    const htmlId = props.htmlId
    const selectionOptions = [
      {
        "value": "op",
        "label": {
          "fi": "Opintopisteinä",
          "sv": "TODO SV Opintopisteinä"
        }
      },
      {
        "value": "kp",
        "label": {
          "fi": "Koulutuspäivinä",
          "sv": "TODO SV Koulutuspäivinä"
        }
      }
    ]
    const subFields = {
      "scope-type": {id: "scope-type", fieldType: "radioButton"},
      "scope": {id: "scope", fieldType: "textField"},
      "person-count": {id: "person-count", fieldType: "textField"},
      "total": {id: "total", fieldType: "textField"}
    }
    const valueHolder = {value: this.props.value ? this.props.value : [{"key":"scope-type","value":"kp","fieldType":"radioButton"},
                                                                       {"key":"scope","value": "0","fieldType":"textField"},
                                                                       {"key":"person-count", "value": "0","fieldType":"textField"},
                                                                       {"key":"total", "value": "0","fieldType":"textField"}]}

    const onChange = (field) => {
      return (event) => {
        var value = event.target.value
        if(event.target.id.endsWith("scope") || event.target.id.endsWith("person-count")) {
          value = parseInt(value) ? parseInt(value).toString() : ""
        }
        const fieldUpdate = {
          id: field.id,
          field: field,
          value: value
        }
        InputValueStorage.writeValue({}, valueHolder, fieldUpdate)
        const scopeMultiplier = InputValueStorage.readValue({}, valueHolder, "scope-type") === "op" ? 4.5 : 1
        const scope = parseInt(InputValueStorage.readValue({}, valueHolder, "scope")) ? parseInt(InputValueStorage.readValue({}, valueHolder, "scope")) : 0
        const personCount = parseInt(InputValueStorage.readValue({}, valueHolder, "person-count")) ? parseInt(InputValueStorage.readValue({}, valueHolder, "person-count")) : 0
        const totalUpdate = {
          id: "total",
          field: subFields["total"],
          value: (scopeMultiplier * scope * personCount).toString().replace('.', ',')
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
                         options={selectionOptions}
                          onChange={onChange(subFields["scope-type"])}
                          value={InputValueStorage.readValue({}, valueHolder, "scope-type")}
                          translations={{}}
                          lang={this.props.lang} />
          </td>
          <td>
            <BasicTextField htmlId={htmlId + ".scope"}
                            onChange={onChange(subFields["scope"])}
                            value={InputValueStorage.readValue({}, valueHolder, "scope")}
                            translations={{}}
                            size="extra-extra-small"
                            lang={this.props.lang} />
          </td>
          <td>
            <BasicTextField htmlId={htmlId + ".person-count"}
                            onChange={onChange(subFields["person-count"])}
                            value={InputValueStorage.readValue({}, valueHolder, "person-count")}
                            translations={{}}
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
