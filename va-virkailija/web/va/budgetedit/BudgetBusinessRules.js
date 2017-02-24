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

  static getInitialValuesByFieldId(formContent, answers) {
    const budgetItems =  FormUtil.findFieldsByFieldType(formContent, 'vaBudgetItemElement')
    return _.reduce(budgetItems, (acc, budgetItem) => {
      const descriptionField = budgetItem.children[0]
      const valueField = budgetItem.children[1]
      acc[descriptionField.id] = ''
      if (!budgetItem.params.incrementsTotal) {
        acc[valueField.id] = InputValueStorage.readValue(formContent, answers, valueField.id)
      }
      return acc
    }, {})
  }
}
