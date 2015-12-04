import React from 'react'

import _ from 'lodash'

import ComponentFactory from 'soresu-form/web/form/ComponentFactory'

import {BudgetSummaryElement} from 'va-common/web/va/VaBudgetComponents.jsx'

import BudgetEditElement, {EditSummingBudgetElement, EditBudgetItemElement} from './BudgetEditComponents.jsx'

export default class VaBudgetEditComponentFactory extends ComponentFactory {
  constructor() {
    const fieldTypeMapping = {
      "vaBudget": BudgetEditElement,
      "vaSummingBudgetElement": EditSummingBudgetElement,
      "vaBudgetItemElement": EditBudgetItemElement,
      "vaBudgetSummaryElement": BudgetSummaryElement
    }
    super({ fieldTypeMapping: fieldTypeMapping,
            fieldPropertyMapperMapping:
              {vaBudgetSummaryElement: BudgetSummaryEditPropertyMapper}})
  }
}

class BudgetSummaryEditPropertyMapper {
  static map(props) {
    const overrodeLabels ={labelTranslations: {
      totalSumRowLabel: {fi:"Hankkeen hyväksyttävä rahoitus yhteensä"},
      ophFinancingLabel: {fi:"Opetushallituksen myöntämä rahoitus"},
      selfFinancingLabel: {fi:"Omarahoitus"}
    }}
    const extendedProps = _.extend(overrodeLabels, _.omit(props, "labelTranslations"))
    return extendedProps
  }
}
