import ComponentFactory from "soresu-form/web/form/ComponentFactory";

import { BudgetSummaryElement } from "soresu-form/web/va/VaBudgetComponents";

import BudgetEditElement, {
  EditSummingBudgetElement,
  EditBudgetItemElement,
} from "./BudgetEditComponents";

export default class BudgetEditComponentFactory extends ComponentFactory {
  constructor() {
    super({
      fieldTypeMapping: {
        vaBudget: BudgetEditElement,
        vaSummingBudgetElement: EditSummingBudgetElement,
        vaBudgetItemElement: EditBudgetItemElement,
        vaBudgetSummaryElement: BudgetSummaryElement,
      },
      fieldPropertyMapperMapping: {
        vaBudgetSummaryElement: BudgetSummaryEditPropertyMapper,
      },
    });
  }
}

class BudgetSummaryEditPropertyMapper {
  static map(props: any) {
    return Object.assign({}, props, {
      labelTranslations: {
        totalSumRowLabel: { fi: "Opetushallituksen myöntämä avustus" },
        ophFinancingLabel: { fi: "Opetushallituksen myöntämä avustus" },
        selfFinancingLabel: { fi: "Omarahoitus" },
      },
      showSelfFinancingField: false,
    });
  }
}
