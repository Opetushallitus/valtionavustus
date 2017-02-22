import React from 'react'

import ComponentFactory from 'soresu-form/web/form/ComponentFactory'

import {EditSummingBudgetElement, EditBudgetItemElement} from './SeurantaBudgetEditComponents.jsx'
import BudgetEditElement from '../budgetedit/BudgetEditComponents.jsx'

const Empty = () => <div></div>

export default class SeurantaBudgetEditComponentFactory extends ComponentFactory {
  constructor() {
    const fieldTypeMapping = {
      "vaBudget": BudgetEditElement,
      "vaSummingBudgetElement": EditSummingBudgetElement,
      "vaBudgetItemElement": EditBudgetItemElement,
      "vaBudgetSummaryElement": Empty
    }
    super({
      fieldTypeMapping: fieldTypeMapping,
      fieldPropertyMapperMapping: {}
    })
  }
}
