import _ from 'lodash'

import JsUtil from 'soresu-form/web/form/JsUtil.js'
import InputValueStorage from 'soresu-form/web/form/InputValueStorage.js'
import MoneyValidator from 'soresu-form/web/form/MoneyValidator'

export default class VaBudgetCalculator {
  constructor(onSumCalculatedCallback) {
    this.onSumCalculatedCallback = _.isFunction(onSumCalculatedCallback) ? onSumCalculatedCallback : _.noop
  }

  populateBudgetCalculatedValuesForAllBudgetFields(initialState, reportTotalError) {
    const budgetFields = JsUtil.flatFilter(initialState.form.content, n => n.fieldType === "vaBudget")
    _.forEach(budgetFields, budgetField => {
      this.populateBudgetCalculatedValues(initialState, budgetField, reportTotalError)
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

  populateBudgetCalculatedValues(state, vaBudgetField, reportTotalError) {
    const sumCalculatedCallback = this.onSumCalculatedCallback

    const answersObject = state.saveStatus.values

    const summingFieldChildren = JsUtil.flatFilter(vaBudgetField.children, child => child.fieldType === "vaSummingBudgetElement")
    const subTotalsAndErrorsAndSummingFields = _.map(summingFieldChildren, populateSummingFieldTotal(answersObject, state))

    const subTotals = _.map(subTotalsAndErrorsAndSummingFields, 'sum')
    const useDetailedCosts = _.get(state, 'saveStatus.savedObject.arvio.useDetailedCosts', true)
    const costsGranted = _.get(state, 'saveStatus.savedObject.arvio.costsGranted', 0)
    const total = useDetailedCosts ? _.sum(subTotals) : _.sum(_.rest(subTotals)) + costsGranted
    const someFigureHasError = useDetailedCosts && _.some(subTotalsAndErrorsAndSummingFields, x => x.containsErrors)
    const budgetIsPositive = total > 0
    const budgetIsValid = !someFigureHasError && budgetIsPositive
    const newValidationErrors = budgetIsPositive || !reportTotalError ? [] : [{error: "negative-budget"}]
    state.form.validationErrors = state.form.validationErrors.merge({[vaBudgetField.id]: newValidationErrors})

    const summaryField = _.last(vaBudgetField.children)
    summaryField.totalNeeded = total
    summaryField.budgetIsValid = budgetIsValid
    summaryField.subTotalsAndErrorsAndSummingFields = subTotalsAndErrorsAndSummingFields

    function populateSummingFieldTotal(answersObject, state) {
      return summingBudgetField => {
        const amountValues = VaBudgetCalculator.getAmountValues(summingBudgetField, answersObject, descriptionField => sumCalculatedCallback(descriptionField, state))
        const sum = _.sum(_.map(amountValues, 'value'))
        summingBudgetField.sum = sum
        const containsErrors = _.some(amountValues, errorsAndValue => errorsAndValue.containsErrors)
        return {
          summingBudgetFieldId: summingBudgetField.id,
          label: summingBudgetField.label,
          sum: sum,
          containsErrors: containsErrors
        }
      }
    }
  }
}
