import _ from 'lodash'

import InputValueStorage from 'soresu-form/web/form/InputValueStorage'
import FormUtil from 'soresu-form/web/form/FormUtil'
import JsUtil from 'soresu-form/web/form/JsUtil'
import MathUtil from 'soresu-form/web/form/MathUtil'

export default class VaTraineeDayUtil {
  static formatFloat(floatValue) {
    return floatValue ? floatValue.toFixed(1).replace(".", ",") : "0"
  }

  static calculateTotal(scope, personCount, scopeType) {
    const multiplier = scopeType === "op" ? 4.5 : 1
    return multiplier * scope * personCount
  }

  static composeTotal(scopeValue, personCountValue, scopeType) {
    const parseScope = () => {
      const value = MathUtil.parseDecimal(scopeValue)
      return value ? value : 0
    }

    const parsePerconCount = () => {
      const value = parseInt(personCountValue, 10)
      return value ? value : 0
    }

    const total = VaTraineeDayUtil.calculateTotal(parseScope(), parsePerconCount(), scopeType)

    return VaTraineeDayUtil.formatFloat(total)
  }

  static sumSubfieldValues(calculatorAnswers, subfieldType) {
    return _.reduce(
      calculatorAnswers,
      (sum, ans) => {
        const val = MathUtil.parseDecimal(VaTraineeDayUtil.readSubfieldValue(ans.value, ans.key, subfieldType))
        return (val ? val : 0) + sum
      },
      0)
  }

  static findSubfieldById(subfields, fieldId, subfieldType) {
    const subfieldId = fieldId + "." + subfieldType
    return _.find(subfields, subfield => subfield.key === subfieldId)
  }

  static readSubfieldValue(subfields, fieldId, subfieldType) {
    const subfield = VaTraineeDayUtil.findSubfieldById(subfields, fieldId, subfieldType)
    return subfield ? subfield.value : ""
  }

  static collectCalculatorSpecifications(formSpecificationContent, answers) {
    const calcAnswers = InputValueStorage.readValues(answers, "vaTraineeDayCalculator")

    return _.flatten(_.map(FormUtil.findFieldsByFieldType(formSpecificationContent, "vaTraineeDayCalculator"), calcSpec => {
      const idPrefix = calcSpec.id.split(".").slice(0, -1).join(".").replace(/-\d+$/, "-")
      return _.chain(calcAnswers)
        .filter(ans => _.startsWith(ans.key, idPrefix))
        .map(ans => _.assign({}, calcSpec, {id: ans.key}))
        .value()
    }))
  }

  static findGrowingFieldsetChildByCalculatorId(answers, calcId) {
    const growingFieldsetChildren = JsUtil.flatFilter(answers, n => { return n.fieldType === "growingFieldsetChild" })
    return _.find(growingFieldsetChildren, gfc => _.find(gfc.value, ans => ans.key === calcId))
  }
}
