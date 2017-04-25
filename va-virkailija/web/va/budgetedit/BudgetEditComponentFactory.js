import React from 'react'

import _ from 'lodash'

import ComponentFactory from 'soresu-form/web/form/ComponentFactory'
import MoneyValue from 'soresu-form/web/form/preview/MoneyValue.jsx'

import {BudgetSummaryElement} from 'va-common/web/va/VaBudgetComponents.jsx'
import {SelfFinancingPropertyMapper} from 'va-common/web/va/VaPropertyMapper.js'

import BudgetEditElement, {EditSummingBudgetElement, EditBudgetItemElement} from './BudgetEditComponents.jsx'

export default class BudgetEditComponentFactory extends ComponentFactory {
  constructor() {
    super({
      fieldTypeMapping: {
        vaBudget: BudgetEditElement,
        vaSummingBudgetElement: EditSummingBudgetElement,
        vaBudgetItemElement: EditBudgetItemElement,
        vaBudgetSummaryElement: BudgetSummaryElement,
        vaSelfFinancingField: MoneyValue
      },
      fieldPropertyMapperMapping: {
        vaBudgetSummaryElement: BudgetSummaryEditPropertyMapper,
        vaSelfFinancingField: SelfFinancingPropertyMapper
      }
    })
  }
}

class BudgetSummaryEditPropertyMapper {
  static map(props) {
    const overriddenLabels ={labelTranslations: {
      totalSumRowLabel: {fi:"Opetushallituksen myöntämä avustus"},
      ophFinancingLabel: {fi:"Opetushallituksen myöntämä avustus"},
      selfFinancingLabel: {fi:"Omarahoitus"}
    }}
    return _.extend(overriddenLabels, _.omit(props, "labelTranslations"))
  }
}
