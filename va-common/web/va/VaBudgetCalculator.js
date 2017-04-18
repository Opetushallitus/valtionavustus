import _ from 'lodash'

import FormUtil from 'soresu-form/web/form/FormUtil'
import JsUtil from 'soresu-form/web/form/JsUtil'
import InputValueStorage from 'soresu-form/web/form/InputValueStorage'
import MoneyValidator from 'soresu-form/web/form/MoneyValidator'

import MathUtil from './util/MathUtil'

export default class VaBudgetCalculator {
  constructor(onSumCalculatedCallback) {
    this.onSumCalculatedCallback = _.isFunction(onSumCalculatedCallback) ? onSumCalculatedCallback : _.noop
  }

  deriveValuesForAllBudgetElementsByMutation(state, spec) {
    const vaBudgetElementsToMutate = JsUtil.flatFilter(state.form.content, n => n.fieldType === "vaBudget")
    _.forEach(vaBudgetElementsToMutate, element => {
      this.deriveValuesForBudgetFieldsByMutation(element, state, spec)
    })
  }

  handleBudgetAmountUpdate(state, amountFieldId) {
    const vaBudgetElements = JsUtil.flatFilter(state.form.content, n => n.fieldType === "vaBudget" && !_.isEmpty(JsUtil.findJsonNodeContainingId(n, amountFieldId)))
    if(_.isEmpty(vaBudgetElements)) {
      return undefined
    }
    if(vaBudgetElements.length !== 1) {
      throw new Error(amountFieldId + ' has ' + vaBudgetElements.length + ' budget parents, looks like bug.')
    }
    return this.deriveValuesForBudgetFieldsByMutation(vaBudgetElements[0], state, {reportValidationErrors: true})
  }

  static getAmountValuesAndSetRequiredFieldsByMutation(summingBudgetElement, answersObject, sumCalculatedCallback) {
    return _.map(summingBudgetElement.children, itemField => {
      const amountCoefficient = itemField.params.incrementsTotal ? 1 : -1
      const descriptionField = itemField.children[0]
      const amountField = itemField.children[1]
      const amountValue = InputValueStorage.readValue(null, answersObject, amountField.id)
      const isAmountValid = isNotEmpty(amountValue) && !MoneyValidator.validateMoney(amountValue)
      const valueToUse = isAmountValid ? amountValue : 0
      descriptionField.required = isAmountValid && valueToUse > 0  // mutation!
      if(sumCalculatedCallback) {
        sumCalculatedCallback(descriptionField)
      }
      return {"containsErrors": !isAmountValid, "value": amountCoefficient * valueToUse}
    })

    function isNotEmpty(value) {
      return value && _.trim(value).length > 0
    }
  }

  deriveValuesForBudgetFieldsByMutation(
    vaBudgetElement,
    state,
    {reportValidationErrors, fixedSelfFinancingRatio}
  ) {
    const sumCalculatedCallback = this.onSumCalculatedCallback

    const deriveSubtotalsAndSetSumAndRequiredFieldsByMutation = () => {
      const summingElements = JsUtil.flatFilter(
        vaBudgetElement.children,
        child => child.fieldType === "vaSummingBudgetElement"
      )

      const answersObject = state.saveStatus.values

      return _.map(summingElements, element => {
        const amountValues = VaBudgetCalculator.getAmountValuesAndSetRequiredFieldsByMutation(
          element,
          answersObject,
          descriptionField => sumCalculatedCallback(descriptionField, state)
        )

        const sum = _.sum(_.map(amountValues, 'value'))

        element.sum = sum  // mutation!

        return {
          sum: sum,
          containsErrors: _.some(amountValues, errorsAndValue => errorsAndValue.containsErrors)
        }
      })
    }

    const validateTotalNeeded = subtotals => {
      const useDetailedCosts = _.get(state, 'saveStatus.savedObject.arvio.useDetailedCosts', true)
      const costsGranted = _.get(state, 'saveStatus.savedObject.arvio.costsGranted', 0)
      const subtotalSums = _.map(subtotals, 'sum')
      const totalNeeded = useDetailedCosts
        ? _.sum(subtotalSums)
        : _.sum(_.rest(subtotalSums)) + costsGranted
      const isBudgetPositive = totalNeeded > 0
      const someSubtotalHasError = useDetailedCosts && _.some(subtotals, x => x.containsErrors)
      return {
        value: totalNeeded,
        isBudgetPositive: isBudgetPositive,
        isValid: !someSubtotalHasError && isBudgetPositive,
        useDetailedCosts,
        costsGranted
      }
    }

    const validateFinancing = (summaryElement, minSelfFinancingPercentage, totalNeeded) => {
      const minSelfFinancingValue = MathUtil.percentageShareRoundedUpOf(minSelfFinancingPercentage, totalNeeded)

      const result = {
        minSelfValue: minSelfFinancingValue,
        minSelfPercentage: minSelfFinancingPercentage
      }

      const selfFinancingSpecField = FormUtil.findFieldByFieldType(summaryElement, "vaSelfFinancingField")

      if (!selfFinancingSpecField) {
        return _.assign(result, {
          selfValue: minSelfFinancingValue,
          ophValue: totalNeeded - minSelfFinancingValue,
          isSelfValueANumber: true,
          isValid: true
        })
      }

      if (fixedSelfFinancingRatio) {
        const selfFinancingValue = MathUtil.ratioShareRoundedUpOf(fixedSelfFinancingRatio, totalNeeded)

        return _.assign(result, {
          selfValue: selfFinancingValue,
          ophValue: totalNeeded - selfFinancingValue,
          isSelfValueANumber: true,
          isValid: true
        })
      }

      const selfFinancingAnswer = JsUtil.findFirst(
        state.saveStatus.values,
        answer => answer.key === selfFinancingSpecField.id
      )

      if (!selfFinancingAnswer || MoneyValidator.validateMoney(selfFinancingAnswer.value || "")) {
        return _.assign(result, {
          selfValue: null,
          ophValue: null,
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
      if (!isBudgetPositive) {
        return [{error: "negative-budget"}]
      }

      if (!isSelfFinancingValid) {
        return [{error: "insufficient-self-financing"}]
      }

      return []
    }

    const vaBudgetSummaryElement = _.find(vaBudgetElement.children, n => n.fieldType === "vaBudgetSummaryElement")

    const totalNeeded = validateTotalNeeded(deriveSubtotalsAndSetSumAndRequiredFieldsByMutation())

    const financing = validateFinancing(
      vaBudgetSummaryElement,
      state.avustushaku.content["self-financing-percentage"],
      totalNeeded.value)

    state.form.validationErrors = state.form.validationErrors.merge({
      [vaBudgetElement.id]: reportValidationErrors
        ? makeValidationErrors(totalNeeded.isBudgetPositive, financing.isValid)
        : []
    })

    vaBudgetSummaryElement.totalNeeded = totalNeeded
    vaBudgetSummaryElement.financing = financing
  }
}
