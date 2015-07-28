import React from 'react'

import ComponentFactory from '../form/ComponentFactory.js'
import {VaBudgetElement, SummingBudgetElement, BudgetItemElement, BudgetSummaryElement} from './VaBudgetComponents.jsx'
import VaProjectDescription from './VaProjectDescription.jsx'
import VaEmailVerifyButton from './VaEmailVerifyButton.jsx'

export default class VaComponentFactory extends ComponentFactory {
  constructor() {
    const fieldTypeMapping = {
      "vaBudget": VaBudgetElement,
      "vaSummingBudgetElement": SummingBudgetElement,
      "vaBudgetItemElement": BudgetItemElement,
      "vaBudgetSummaryElement": BudgetSummaryElement,
      "vaProjectDescription": VaProjectDescription,
      "vaEmailVerify": VaEmailVerifyButton

    }
    super(fieldTypeMapping)
  }

  getCustomWrapperComponentProperties(state) {
    return { "avustushaku": state.avustushaku }
  }
}
