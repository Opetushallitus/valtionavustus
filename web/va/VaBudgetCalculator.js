import _ from 'lodash'

import JsUtil from '../form/JsUtil.js'
import Translator from '../form/Translator.js'
import InputValueStorage from '../form/InputValueStorage.js'
import {SyntaxValidator} from '../form/SyntaxValidator.js'
import {FieldUpdateHandler} from '../form/FieldUpdateHandler.js'

export class VaBudgetCalculator {
  static populateBudgetCalculatedValuesForAllBudgetFields(initialState) {
    const budgetFields = JsUtil.flatFilter(initialState.form.content, n => { return n.displayAs === "vaBudget" })
    _.forEach(budgetFields, budgetField => { VaBudgetCalculator.populateBudgetCalculatedValues(initialState, budgetField ) })
  }

static handleBudgetAmountUpdate(state, amountFieldId) {
    const formContent = state.form.content
    const vaBudgetFields = JsUtil.flatFilter(formContent, n => { return n.displayAs === "vaBudget" && !_.isEmpty(JsUtil.findJsonNodeContainingId(n, amountFieldId)) })
    if (_.isEmpty(vaBudgetFields)) {
      return
    }
    if (vaBudgetFields.length !== 1) {
      throw new Error(amountFieldId + ' has ' + vaBudgetFields.length + ' budget parents, looks like bug.')
    }
    return VaBudgetCalculator.populateBudgetCalculatedValues(state, vaBudgetFields[0])
  }

  static populateBudgetCalculatedValues(state, vaBudgetField) {
    const answersObject = state.saveStatus.values

    const summingFieldChildren = JsUtil.flatFilter(vaBudgetField.children, child => { return child.displayAs === "vaSummingBudgetElement" })
    const subTotalsAndErrorsAndFieldIds = _.map(summingFieldChildren, populateSummingFieldTotal(answersObject, state))

    const total = _.reduce(subTotalsAndErrorsAndFieldIds, (acc, x) => { return acc + x.sum }, 0)
    const someFigureHasError = _.some(subTotalsAndErrorsAndFieldIds, x => {
      return x.containsErrors
    })
    const budgetIsValid = !someFigureHasError && total > 0

    const configuration = state.configuration
    const miscTranslator = new Translator(configuration.translations["misc"])

    const resultObject = _.zipObject(_.pluck(subTotalsAndErrorsAndFieldIds, 'summingFieldId'), subTotalsAndErrorsAndFieldIds)
    const totalNeeded = budgetIsValid ? total : miscTranslator.translate("check-numbers", configuration.lang, "VIRHE")
    resultObject.totalNeeded = totalNeeded
    const summaryField = _.last(vaBudgetField.children)
    summaryField.totalNeeded = totalNeeded
    vaBudgetField.summary = resultObject
    return resultObject

    function populateSummingFieldTotal(answersObject, state) {
      return function(summingBudgetField) {
        const amountValues = _.map(summingBudgetField.children, itemField => {
          const amountCoefficient = itemField.params.incrementsTotal ? 1 : -1
          const descriptionField = itemField.children[0]
          const amountField = itemField.children[1]
          const amountValue = InputValueStorage.readValue(null, answersObject, amountField.id)
          const isAmountValid = _.isEmpty(SyntaxValidator.validateSyntax(amountField, amountValue))
          const valueToUse = isAmountValid ?
            amountValue :
            0
          descriptionField.required = isAmountValid && valueToUse > 0
          FieldUpdateHandler.triggerFieldUpdatesForValidation([descriptionField], state)
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
    }
  }
}