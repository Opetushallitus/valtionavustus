import React from 'react'

import ComponentFactory from 'soresu-form/web/form/ComponentFactory'
import MoneyValue from 'soresu-form/web/form/preview/MoneyValue.jsx'

import {BudgetSummaryElement} from 'va-common/web/va/VaBudgetComponents.jsx'
import {SelfFinancingPropertyMapper} from 'va-common/web/va/VaPropertyMapper'

import BudgetEditElement, {EditSummingBudgetElement, EditBudgetItemElement} from './BudgetEditComponents.jsx'
import {BudgetSummaryEditPropertyMapper} from './BudgetEditComponentFactory'

export default class BudgetEditPreviewComponentFactory extends ComponentFactory {
  constructor() {
    const fieldTypeMapping = {
      "vaBudget": PreviewBudgetEditElement,
      "vaSummingBudgetElement": EditSummingBudgetElement,
      "vaBudgetItemElement": EditBudgetItemElement,
      "vaBudgetSummaryElement": BudgetSummaryElement,
      "vaSelfFinancingField": MoneyValue
    }
    super({
      fieldTypeMapping,
      fieldPropertyMapperMapping: {
        vaBudgetSummaryElement: BudgetSummaryEditPropertyMapper,
        vaSelfFinancingField: SelfFinancingPropertyMapper
      }
    })
  }
}

class PreviewBudgetEditElement extends BudgetEditElement {
  html(htmlId, children) {
    return (<div className="va-budget" id={htmlId}>
             {children}
            </div>)
  }}
