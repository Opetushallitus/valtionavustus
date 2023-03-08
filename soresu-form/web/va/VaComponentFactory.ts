import ComponentFactory from 'soresu-form/web/form/ComponentFactory'
import CheckboxButton from 'soresu-form/web/form/component/CheckboxButton'
import EmailTextField from 'soresu-form/web/form/component/EmailTextField'
import MoneyTextField from 'soresu-form/web/form/component/MoneyTextField'
import {
  TrimmingTextFieldPropertyMapper,
  FieldOnChangePropertyMapper,
} from 'soresu-form/web/form/component/PropertyMapper'

import VaBudgetElement, {
  SummingBudgetElement,
  BudgetItemElement,
  BudgetSummaryElement,
} from './VaBudgetComponents'

import {
  VaFocusAreasPropertyMapper,
  BudgetSummaryPropertyMapper,
  SelfFinancingPropertyMapper,
} from './VaPropertyMapper'

import VaProjectDescription from './VaProjectDescription'

import VaTraineeDayCalculator, { VaTraineeDayTotalCalculator } from './VaTraineeDayCalculator'

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
        vaTraineeDayTotalCalculator: VaTraineeDayTotalCalculator,
      },
      fieldPropertyMapperMapping: {
        vaEmailNotification: TrimmingTextFieldPropertyMapper,
        vaFocusAreas: VaFocusAreasPropertyMapper,
        vaBudgetSummaryElement: BudgetSummaryPropertyMapper,
        vaSelfFinancingField: SelfFinancingPropertyMapper,
        vaTraineeDayCalculator: FieldOnChangePropertyMapper,
      },
    })
  }

  getCustomComponentProperties(state: any) {
    return { avustushaku: state.avustushaku }
  }
}
