import React from 'react'

import ComponentFactory from 'soresu-form/web/form/ComponentFactory'

import {BudgetSummaryElement} from 'va-common/web/va/VaBudgetComponents.jsx'

import BudgetEditElement, {EditSummingBudgetElement, EditBudgetItemElement} from './BudgetEditComponents.jsx'
import {BudgetSummaryEditPropertyMapper} from './BudgetEditComponentFactory'

export default class BudgetEditPreviewComponentFactory extends ComponentFactory {
  constructor() {
    const fieldTypeMapping = {
      "vaBudget": PreviewBudgetEditElement,
      "vaSummingBudgetElement": EditSummingBudgetElement,
      "vaBudgetItemElement": EditBudgetItemElement,
      "vaBudgetSummaryElement": BudgetSummaryElement
    }
    super({ fieldTypeMapping,
            fieldPropertyMapperMapping:
            {vaBudgetSummaryElement: BudgetSummaryEditPropertyMapper}})
  }
}

class PreviewBudgetEditElement extends BudgetEditElement {
  html(htmlId, children) {
    return (<div className="va-budget" id={htmlId}>
             {children}
            </div>)
  }}
