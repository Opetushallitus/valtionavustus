import _ from 'lodash'

import FormUtil from 'soresu-form/web/form/FormUtil'
import JsUtil from 'soresu-form/web/form/JsUtil'
import InputValueStorage from 'soresu-form/web/form/InputValueStorage'
import MoneyValidator from 'soresu-form/web/form/MoneyValidator'

export default class VaBudgetCalculator {
  constructor(onSumCalculatedCallback) {
    this.onSumCalculatedCallback = _.isFunction(onSumCalculatedCallback) ? onSumCalculatedCallback : _.noop
  }

  populateBudgetCalculatedValuesForAllBudgetFields(initialState, reportErrors) {
    const budgetFields = JsUtil.flatFilter(initialState.form.content, n => n.fieldType === "vaBudget")
    _.forEach(budgetFields, budgetField => {
      this.populateBudgetCalculatedValues(initialState, budgetField, reportErrors)
    })
  }

  handleBudgetAmountUpdate(state, amountFieldId) {
    const formContent = state.form.content
    const vaBudgetFields = JsUtil.flatFilter(formContent, n => n.fieldType === "vaBudget" && !_.isEmpty(JsUtil.findJsonNodeContainingId(n, amountFieldId)))
    if(_.isEmpty(vaBudgetFields)) {
      return undefined
    }
    if(vaBudgetFields.length !== 1) {
      throw new Error(amountFieldId + ' has ' + vaBudgetFields.length + ' budget parents, looks like bug.')
    }
    return this.populateBudgetCalculatedValues(state, vaBudgetFields[0], true)
  }

  static getAmountValues(summingBudgetField, answersObject, sumCalculatedCallback) {
    return _.map(summingBudgetField.children, itemField => {
      const amountCoefficient = itemField.params.incrementsTotal ? 1 : -1
      const descriptionField = itemField.children[0]
      const amountField = itemField.children[1]
      const amountValue = InputValueStorage.readValue(null, answersObject, amountField.id)
      const isAmountValid = isNotEmpty(amountValue) && !MoneyValidator.validateMoney(amountValue)
      const valueToUse = isAmountValid ? amountValue : 0
      descriptionField.required = isAmountValid && valueToUse > 0
      if(sumCalculatedCallback) {
        sumCalculatedCallback(descriptionField)
      }
      return {"containsErrors": !isAmountValid, "value": amountCoefficient * valueToUse}
    })

    function isNotEmpty(value) {
      return value && _.trim(value).length > 0
    }
  }

  populateBudgetCalculatedValues(state, vaBudgetField, reportErrors) {
    const sumCalculatedCallback = this.onSumCalculatedCallback

    const populateSummingFieldTotals = () => {
      const summingFields = JsUtil.flatFilter(
        vaBudgetField.children,
        child => child.fieldType === "vaSummingBudgetElement"
      )

      const answersObject = state.saveStatus.values

      return _.map(summingFields, summingField => {
        const amountValues = VaBudgetCalculator.getAmountValues(summingField, answersObject, descriptionField => sumCalculatedCallback(descriptionField, state))
        const sum = _.sum(_.map(amountValues, 'value'))

        summingField.sum = sum

        return {
          summingBudgetFieldId: summingField.id,
          label: summingField.label,
          sum: sum,
          containsErrors: _.some(amountValues, errorsAndValue => errorsAndValue.containsErrors)
        }
      })
    }

    const validateTotalNeeded = (subTotalsAndErrorsAndSummingFields) => {
      const useDetailedCosts = _.get(state, 'saveStatus.savedObject.arvio.useDetailedCosts', true)
      const costsGranted = _.get(state, 'saveStatus.savedObject.arvio.costsGranted', 0)
      const subTotals = _.map(subTotalsAndErrorsAndSummingFields, 'sum')
      const totalNeeded = useDetailedCosts
        ? _.sum(subTotals)
        : _.sum(_.rest(subTotals)) + costsGranted
      const isBudgetPositive = totalNeeded > 0
      const someSubTotalHasError = useDetailedCosts && _.some(subTotalsAndErrorsAndSummingFields, x => x.containsErrors)
      return {
        value: totalNeeded,
        isBudgetPositive: isBudgetPositive,
        isValid: !someSubTotalHasError && isBudgetPositive
      }
    }

    const validateFinancing = (summaryField, minSelfFinancingPercentage, totalNeeded) => {
      const minSelfFinancingValue = VaBudgetCalculator.shareOf(minSelfFinancingPercentage, totalNeeded)
      const result = {
        minSelfValue: minSelfFinancingValue,
        minSelfPercentage: minSelfFinancingPercentage
      }

      const selfFinancingSpecField = FormUtil.findField(summaryField, "self-financing-amount")

      if (!selfFinancingSpecField) {
        return _.assign(result, {
          selfValue: minSelfFinancingValue,
          ophValue: totalNeeded - minSelfFinancingValue,
          isSelfValueANumber: true,
          isValid: true
        })
      }

      const selfFinancingAnswer = JsUtil.findFirst(state.saveStatus.values, answer => answer.key === "self-financing-amount")

      if (!selfFinancingAnswer) {
        return _.assign(result, {
          selfValue: null,
          isSelfValueANumber: false,
          isValid: false
        })
      }

      if (MoneyValidator.validateMoney(selfFinancingAnswer.value || "")) {
        return _.assign(result, {
          selfValue: null,
          isSelfValueANumber: false,
          isValid: false
        })
      }

      const selfFinancingValue = Number(selfFinancingAnswer.value)
      const isSelfFinancingSufficient = selfFinancingValue >= minSelfFinancingValue && selfFinancingValue <= totalNeeded
      return _.assign(result, {
        selfValue: selfFinancingValue,
        ophValue: totalNeeded - selfFinancingValue,
        isSelfValueANumber: true,
        isValid: isSelfFinancingSufficient
      })
    }

    const makeValidationErrors = (isBudgetPositive, isSelfFinancingValid) => {
      if (!reportErrors) {
        return []
      }

      if (!isBudgetPositive) {
        return [{error: "negative-budget"}]
      }

      if (!isSelfFinancingValid) {
        return [{error: "insufficient-self-financing"}]
      }

      return []
    }

    const vaBudgetSummaryField = _.last(vaBudgetField.children)

    const subTotalsAndErrorsAndSummingFields = populateSummingFieldTotals()
    const totalNeeded = validateTotalNeeded(subTotalsAndErrorsAndSummingFields)
    const financing = validateFinancing(vaBudgetSummaryField, state.avustushaku.content["self-financing-percentage"], totalNeeded.value)

    state.form.validationErrors = state.form.validationErrors.merge({
      [vaBudgetField.id]: makeValidationErrors(totalNeeded.isBudgetPositive, financing.isValid)
    })

    vaBudgetSummaryField.totalNeeded = totalNeeded
    vaBudgetSummaryField.financing = financing
    vaBudgetSummaryField.subTotalsAndErrorsAndSummingFields = subTotalsAndErrorsAndSummingFields
  }

  static shareOf(percentage, total) {
    return Math.ceil((percentage / 100) * total)
  }

  static percentageOf(part, total) {
    return (part / total) * 100
  }
}
