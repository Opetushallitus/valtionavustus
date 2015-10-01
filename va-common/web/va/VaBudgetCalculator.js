import _ from 'lodash'

import JsUtil from 'soresu-form/web/form/JsUtil.js'
import InputValueStorage from 'soresu-form/web/form/InputValueStorage.js'
import MoneyValidator from 'soresu-form/web/form/MoneyValidator'

export default class VaBudgetCalculator {
  constructor(onSumCalculatedCallback) {
    this.onSumCalculatedCallback = _.isFunction(onSumCalculatedCallback) ? onSumCalculatedCallback : _.noop
  }

  populateBudgetCalculatedValuesForAllBudgetFields(initialState, reportTotalError) {
    const budgetFields = JsUtil.flatFilter(initialState.form.content, n => { return n.displayAs === "vaBudget" })
    _.forEach(budgetFields, budgetField => { this.populateBudgetCalculatedValues(initialState, budgetField, reportTotalError ) })
  }

  handleBudgetAmountUpdate(state, amountFieldId) {
    const formContent = state.form.content
    const vaBudgetFields = JsUtil.flatFilter(formContent, n => { return n.displayAs === "vaBudget" && !_.isEmpty(JsUtil.findJsonNodeContainingId(n, amountFieldId)) })
    if (_.isEmpty(vaBudgetFields)) {
      return
    }
    if (vaBudgetFields.length !== 1) {
      throw new Error(amountFieldId + ' has ' + vaBudgetFields.length + ' budget parents, looks like bug.')
    }
    return this.populateBudgetCalculatedValues(state, vaBudgetFields[0], true)
  }

  populateBudgetCalculatedValues(state, vaBudgetField, reportTotalError) {
    const sumCalculatedCallback = this.onSumCalculatedCallback

    const answersObject = state.saveStatus.values

    const summingFieldChildren = JsUtil.flatFilter(vaBudgetField.children, child => { return child.displayAs === "vaSummingBudgetElement" })
    const subTotalsAndErrorsAndFieldIds = _.map(summingFieldChildren, populateSummingFieldTotal(answersObject, state))

    const total = _.reduce(subTotalsAndErrorsAndFieldIds, (acc, x) => { return acc + x.sum }, 0)
    const someFigureHasError = _.some(subTotalsAndErrorsAndFieldIds, x => {
      return x.containsErrors
    })
    const budgetIsPositive = total > 0;
    const budgetIsValid = !someFigureHasError && budgetIsPositive
    const newValidationErrors = budgetIsPositive || !reportTotalError ? [] : [{ "error": "negative-budget" }]
    state.form.validationErrors = state.form.validationErrors.merge({[vaBudgetField.id]: newValidationErrors})

    const summaryField = _.last(vaBudgetField.children)
    summaryField.totalNeeded = total
    summaryField.budgetIsValid = budgetIsValid

    function populateSummingFieldTotal(answersObject, state) {
      return function(summingBudgetField) {
        const amountValues = _.map(summingBudgetField.children, itemField => {
          const amountCoefficient = itemField.params.incrementsTotal ? 1 : -1
          const descriptionField = itemField.children[0]
          const amountField = itemField.children[1]
          const amountValue = InputValueStorage.readValue(null, answersObject, amountField.id)
          const isAmountValid = isNotEmpty(amountValue) && !MoneyValidator.validateMoney(amountValue)
          const valueToUse = isAmountValid ? amountValue : 0
          descriptionField.required = isAmountValid && valueToUse > 0
          sumCalculatedCallback(descriptionField, state)
          return { "containsErrors": !isAmountValid, "value": amountCoefficient * valueToUse }
        })
        const sum = _.reduce(amountValues, (total, errorsAndValue) => { return total + errorsAndValue.value }, 0)
        summingBudgetField.sum = sum
        const containsErrors = _.some(amountValues, (errorsAndValue) => { return errorsAndValue.containsErrors })
        return {
          "summingFieldId": summingBudgetField.id,
          "sum": sum,
          "containsErrors": containsErrors
        }
      }

      function isNotEmpty(value) {
        return value && _.trim(value).length > 0
      }
    }
  }
}
