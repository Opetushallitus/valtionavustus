import _ from 'lodash'
import React from 'react'

import BasicFieldComponent from 'soresu-form/web/form/component/BasicFieldComponent.jsx'
import BasicTextField from 'soresu-form/web/form/component/BasicTextField.jsx'
import Translator from 'soresu-form/web/form/Translator'

import VaTraineeDayUtil from 'va-common/web/va/VaTraineeDayUtil'
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
    const fieldId = field.id
    const answers = props.controller.hakemus.answers
    const currentTraineeDayGrowingFieldsetChild = VaTraineeDayUtil.findGrowingFieldsetChildByCalculatorId(answers, fieldId)
    const originalCalcAnswer = _.find(currentTraineeDayGrowingFieldsetChild.value, ans => ans.key === fieldId)
    const grantedCalcAnswer = {value: this.props.value ? this.props.value : VaTraineeDayCalculator.emptySubfieldsFor(field.id)}

    const allowEditing = props.controller.allowEditing
    const hasError = props.hasError

    const onChange = subfield => {
      return VaTraineeDayCalculator.onChange(subfield, props, grantedCalcAnswer, field)
    }

    const nameStr = TraineeDayEditCalculator.renderNameAnswer(currentTraineeDayGrowingFieldsetChild.value)

    const orgScopeStr = VaTraineeDayUtil.readSubfieldValue(originalCalcAnswer.value, fieldId, "scope")
    const orgScopeTypeStr = VaTraineeDayUtil.readSubfieldValue(originalCalcAnswer.value, fieldId, "scope-type")
    const orgPersonCountStr = VaTraineeDayUtil.readSubfieldValue(originalCalcAnswer.value, fieldId, "person-count")
    const orgTotalStr = VaTraineeDayUtil.readSubfieldValue(originalCalcAnswer.value, fieldId, "total")

    const grtScopeStr = VaTraineeDayUtil.readSubfieldValue(grantedCalcAnswer.value, fieldId, "scope")
    const grtScopeIsValid = VaTraineeDayUtil.parseFloat(grtScopeStr) >= 0
    const grtScopeTypeStr = VaTraineeDayUtil.readSubfieldValue(grantedCalcAnswer.value, fieldId, "scope-type")
    const grtPersonCountStr = VaTraineeDayUtil.readSubfieldValue(grantedCalcAnswer.value, fieldId, "person-count")
    const grtPersonCountIsValid = parseInt(grtPersonCountStr, 10) >= 0
    const grtTotalStr = VaTraineeDayUtil.readSubfieldValue(grantedCalcAnswer.value, fieldId, "total")

    return (
      <tr>
        <td>{nameStr}</td>
        <td className="text-gray original-value">{orgScopeStr}&nbsp;{orgScopeTypeStr}</td>
        <td style={{whiteSpace:'nowrap'}}>
          <BasicTextField htmlId={htmlId + ".scope"}
                          disabled={!allowEditing}
                          onChange={onChange(VaTraineeDayCalculator.subfieldSpecFor(field.id, "scope"))}
                          value={grtScopeStr}
                          translations={{}}
                          hasError={hasError && !grtScopeIsValid}
                          size="extra-extra-small"
                          lang={this.props.lang} />
          {grtScopeTypeStr}
        </td>
        <td className="text-gray original-value">{orgPersonCountStr}</td>
        <td>
          <BasicTextField htmlId={htmlId + ".person-count"}
                          disabled={!allowEditing}
                          onChange={onChange(VaTraineeDayCalculator.subfieldSpecFor(field.id, "person-count"))}
                          value={grtPersonCountStr}
                          translations={{}}
                          hasError={hasError && !grtPersonCountIsValid}
                          size="extra-extra-small"
                          lang={this.props.lang} />
        </td>
        <td className="text-gray">{orgTotalStr}</td>
        <td><strong>{grtTotalStr}</strong></td>
      </tr>
    )
  }

  static renderNameAnswer(subfields) {
    const subfield = _.find(subfields, ans => ans.fieldType === "nameField")
    return subfield ? subfield.value : ""
  }
}
