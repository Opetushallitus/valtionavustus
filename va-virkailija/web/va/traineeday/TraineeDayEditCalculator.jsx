import React from 'react'
import ClassNames from 'classnames'
import _ from 'lodash'

import BasicFieldComponent from 'soresu-form/web/form/component/BasicFieldComponent.jsx'
import RadioButton from 'soresu-form/web/form/component/RadioButton.jsx'
import BasicTextField from 'soresu-form/web/form/component/BasicTextField.jsx'
import Translator from 'soresu-form/web/form/Translator'
import InputValueStorage from 'soresu-form/web/form/InputValueStorage'
import FormUtil from 'soresu-form/web/form/FormUtil'
import Koulutusosiot from './Koulutusosiot'

import VaTraineeDayCalculator from 'va-common/web/va/VaTraineeDayCalculator.jsx'

export default class TraineeDayEditCalculator extends BasicFieldComponent {

  constructor(props) {
    super(props)
    this.translator = new Translator(props.translations.form["trainee-day-calculator"])
  }

  render() {
    const props = this.props
    const htmlId = props.htmlId
    const field = props.field
    const answers = props.controller.hakemus.answers
    const currentKoulutusOsioValues = Koulutusosiot.values(answers,field.id)
    const name = Koulutusosiot.nameField(currentKoulutusOsioValues)
    const originalValues = Koulutusosiot.traineeDayCalculator(currentKoulutusOsioValues)
    const valueHolder = {value: this.props.value ? this.props.value : VaTraineeDayCalculator.emptyValue(field)}
    const allowEditing = props.controller.allowEditing

    const onChange = (subField) => {
      return VaTraineeDayCalculator.onChange(subField, props, valueHolder, field)
    }

    return (
          <tr>
            <td>{name}</td>
            <td className="text-grey original-value">
              {VaTraineeDayCalculator.readSubValue(originalValues, field.id, "scope") }{VaTraineeDayCalculator.readSubValue(originalValues, field.id, "scope-type")}
            </td>
            <td style={{whiteSpace:'nowrap'}}>
              <BasicTextField htmlId={htmlId + ".scope"}
                              disabled={!allowEditing}
                              onChange={onChange(VaTraineeDayCalculator.subField(field, "scope"))}
                              value={VaTraineeDayCalculator.readSubValue(valueHolder, field.id, "scope") }
                              translations={{}}
                              hasError={props.hasError && !(parseFloat(VaTraineeDayCalculator.readSubValue(valueHolder, field.id, "scope").replace(",", ".")) >= 0)}
                              size="extra-extra-small"
                              lang={this.props.lang} />
              {VaTraineeDayCalculator.readSubValue(valueHolder, field.id, "scope-type")}
            </td>
            <td className="text-grey original-value">
              {VaTraineeDayCalculator.readSubValue(originalValues, field.id, "person-count")}
            </td>
            <td>
              <BasicTextField htmlId={htmlId + ".person-count"}
                              disabled={!allowEditing}
                              onChange={onChange(VaTraineeDayCalculator.subField(field, "person-count"))}
                              value={VaTraineeDayCalculator.readSubValue(valueHolder, field.id, "person-count") }
                              translations={{}}
                              hasError={props.hasError && !(parseInt(VaTraineeDayCalculator.readSubValue(valueHolder, field.id, "person-count")) >= 0)}
                              size="extra-extra-small"
                              lang={this.props.lang} />
            </td>
            <td className="text-grey">
              {InputValueStorage.readValue({}, originalValues, field.id + ".total")}
            </td>
            <td>
              <strong>{InputValueStorage.readValue({}, valueHolder, field.id + ".total")}</strong>
            </td>
          </tr>
    )
  }
}
