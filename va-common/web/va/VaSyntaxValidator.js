import _ from 'lodash'

import MoneyValidator from 'soresu-form/web/form/MoneyValidator'

import VaTraineeDayCalculator from './VaTraineeDayCalculator.jsx'

export default class VaSyntaxValidator {
  static validateSyntax(field, value) {
    switch (field.fieldType) {
      case 'vaSelfFinancingField':
        return MoneyValidator.validateMoney(value);
      case 'vaTraineeDayCalculator':
        return VaTraineeDayCalculator.validateTotal(field, value)
      default:
        return undefined;
    }
  }
}
