import React from 'react'

import ComponentFactory from '../../../va-common/web/form/ComponentFactory.js'
import {VaBudgetElement, SummingBudgetElement, BudgetItemElement, BudgetSummaryElement} from './VaBudgetComponents.jsx'
import VaProjectDescription from './VaProjectDescription.jsx'

export default class VaComponentFactory extends ComponentFactory {
  constructor() {
    const fieldTypeMapping = {
      "vaBudget": VaBudgetElement,
      "vaSummingBudgetElement": SummingBudgetElement,
      "vaBudgetItemElement": BudgetItemElement,
      "vaBudgetSummaryElement": BudgetSummaryElement,
      "vaProjectDescription": VaProjectDescription
    }
    super(fieldTypeMapping)
  }

  getCustomWrapperComponentProperties(state) {
    return { "avustushaku": state.avustushaku }
  }
}
