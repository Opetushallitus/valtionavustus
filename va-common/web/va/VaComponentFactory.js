import React from 'react'

import ComponentFactory from 'soresu-form/web/form/ComponentFactory'
import CheckboxButton from 'soresu-form/web/form/component/CheckboxButton.jsx'
import EmailTextField from 'soresu-form/web/form/component/EmailTextField.jsx'
import {TrimmingTextFieldPropertyMapper, FieldOnChangePropertyMapper} from 'soresu-form/web/form/component/PropertyMapper'

import VaBudgetElement, {SummingBudgetElement, BudgetItemElement, BudgetSummaryElement,BudgetGrantedElement} from './VaBudgetComponents.jsx'
import {VaFocusAreasPropertyMapper} from './VaPropertyMapper.js'
import VaProjectDescription from './VaProjectDescription.jsx'
import VaTraineeDayCalculator, {VaTraineeDayTotalCalculator} from './VaTraineeDayCalculator.jsx'

export default class VaComponentFactory extends ComponentFactory {
  constructor() {
    const fieldTypeMapping = {
      "vaBudget": VaBudgetElement,
      "vaSummingBudgetElement": SummingBudgetElement,
      "vaBudgetItemElement": BudgetItemElement,
      "vaBudgetSummaryElement": BudgetSummaryElement,
      "vaProjectDescription": VaProjectDescription,
      "vaFocusAreas": CheckboxButton,
      "vaEmailNotification": EmailTextField,
      "vaTraineeDayCalculator": VaTraineeDayCalculator,
      "vaTraineeDayTotalCalculator": VaTraineeDayTotalCalculator,
      "vaBudgetGrantedElement": BudgetGrantedElement
    }
    super({fieldTypeMapping: fieldTypeMapping,
           fieldPropertyMapperMapping: {
             "vaFocusAreas": VaFocusAreasPropertyMapper,
             "vaEmailNotification": TrimmingTextFieldPropertyMapper,
             "vaTraineeDayCalculator": FieldOnChangePropertyMapper }})
  }

  getCustomComponentProperties(state) {
    return { "avustushaku": state.avustushaku, "overriddenAnswers": state.overriddenAnswers}
  }
}
