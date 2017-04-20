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
}
