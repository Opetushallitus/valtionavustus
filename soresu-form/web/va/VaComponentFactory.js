import ComponentFactory from 'soresu-form/web/form/ComponentFactory.jsx'
import CheckboxButton from 'soresu-form/web/form/component/CheckboxButton.jsx'
import EmailTextField from 'soresu-form/web/form/component/EmailTextField.jsx'
import MoneyTextField from 'soresu-form/web/form/component/MoneyTextField.jsx'
import {TrimmingTextFieldPropertyMapper, FieldOnChangePropertyMapper} from 'soresu-form/web/form/component/PropertyMapper'

import VaBudgetElement, {
  SummingBudgetElement,
  BudgetItemElement,
  BudgetSummaryElement,
} from './VaBudgetComponents.jsx'

import {
  VaFocusAreasPropertyMapper,
  BudgetSummaryPropertyMapper,
  SelfFinancingPropertyMapper
} from './VaPropertyMapper'

import VaProjectDescription from './VaProjectDescription.jsx'

import VaTraineeDayCalculator, {VaTraineeDayTotalCalculator} from './VaTraineeDayCalculator.jsx'

export default class VaComponentFactory extends ComponentFactory {
  constructor() {
    super({
      fieldTypeMapping: {
        vaBudget: VaBudgetElement,
        vaSummingBudgetElement: SummingBudgetElement,
        vaBudgetItemElement: BudgetItemElement,
        vaBudgetSummaryElement: BudgetSummaryElement,
        vaProjectDescription: VaProjectDescription,
        vaSelfFinancingField: MoneyTextField,
        vaFocusAreas: CheckboxButton,
        vaEmailNotification: EmailTextField,
        vaTraineeDayCalculator: VaTraineeDayCalculator,
        vaTraineeDayTotalCalculator: VaTraineeDayTotalCalculator
      },
      fieldPropertyMapperMapping: {
        vaEmailNotification: TrimmingTextFieldPropertyMapper,
        vaFocusAreas: VaFocusAreasPropertyMapper,
        vaBudgetSummaryElement: BudgetSummaryPropertyMapper,
        vaSelfFinancingField: SelfFinancingPropertyMapper,
        vaTraineeDayCalculator: FieldOnChangePropertyMapper
      }
    })
  }

  getCustomComponentProperties(state) {
    return { "avustushaku": state.avustushaku }
  }
}
