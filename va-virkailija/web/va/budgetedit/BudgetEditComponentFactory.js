import React from 'react'

import _ from 'lodash'

import ComponentFactory from 'soresu-form/web/form/ComponentFactory'

import {BudgetSummaryElement} from 'va-common/web/va/VaBudgetComponents.jsx'

import BudgetEditElement, {EditSummingBudgetElement, EditBudgetItemElement} from './BudgetEditComponents.jsx'

export default class BudgetEditComponentFactory extends ComponentFactory {
  constructor() {
    super({
      fieldTypeMapping: {
        vaBudget: BudgetEditElement,
        vaSummingBudgetElement: EditSummingBudgetElement,
        vaBudgetItemElement: EditBudgetItemElement,
        vaBudgetSummaryElement: BudgetSummaryElement
      },
      fieldPropertyMapperMapping: {
        vaBudgetSummaryElement: BudgetSummaryEditPropertyMapper
      }
    })
  }
}

class BudgetSummaryEditPropertyMapper {
  static map(props) {
    return _.assign({}, props, {
      labelTranslations: {
        totalSumRowLabel: {fi:"Opetushallituksen myöntämä avustus"},
        ophFinancingLabel: {fi:"Opetushallituksen myöntämä avustus"},
        selfFinancingLabel: {fi:"Omarahoitus"}
      },
      showSelfFinancingField: false
    })
  }
}
