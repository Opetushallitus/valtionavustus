import React from 'react'

import ComponentFactory from 'soresu-form/web/form/ComponentFactory.jsx'

import {EditSummingBudgetElement, EditBudgetItemElement} from './SeurantaBudgetEditComponents.jsx'
import BudgetEditElement from '../budgetedit/BudgetEditComponents.jsx'

const Empty = () => <div></div>

export default class SeurantaBudgetEditComponentFactory extends ComponentFactory {
  constructor() {
    super({
      fieldTypeMapping: {
        vaBudget: BudgetEditElement,
        vaSummingBudgetElement: EditSummingBudgetElement,
        vaBudgetItemElement: EditBudgetItemElement,
        vaBudgetSummaryElement: Empty
      },
      fieldPropertyMapperMapping: {}
    })
  }
}
