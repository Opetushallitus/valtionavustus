import _ from 'lodash'

import FormUtil from 'soresu-form/web/form/FormUtil'
import InputValueStorage from 'soresu-form/web/form/InputValueStorage'

export default class BudgetBusinessRules {
  constructor(budgetFormSpec, arvio) {
    this.projectBudgetFieldId = budgetFormSpec.children[0].id
    this.arvio = arvio
  }

  isSummingBudgetElementForProject(field) {
    return field.fieldType === "vaSummingBudgetElement" && field.id === this.projectBudgetFieldId
  }

  isBudgetItemElementForProject(field) {
    return field.fieldType === "vaBudgetItemElement" && field.params.incrementsTotal
  }

  showDetailedCostsForBudgetField(field) {
    const useDetailedCosts = this.arvio.useDetailedCosts

    if (useDetailedCosts) {
      return true
    }

    return !(this.isSummingBudgetElementForProject(field) || this.isBudgetItemElementForProject(field))
  }

  static collectHakemusBudgetAnswers(formContent, answers) {
    return _.reduce(FormUtil.findFieldsByFieldType(formContent, "vaBudget"), (acc, vaBudget) => {
      _.forEach(FormUtil.findFieldsByFieldType(vaBudget, "vaBudgetItemElement"), budgetItem => {
        const descriptionField = budgetItem.children[0]
        const valueField = budgetItem.children[1]
        acc[descriptionField.id] = ''
        if (!budgetItem.params.incrementsTotal) {
          acc[valueField.id] = InputValueStorage.readValue(null, answers, valueField.id)
        }
      })
      return acc
    }, {})
  }
}
