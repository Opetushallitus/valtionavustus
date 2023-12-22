import { isValidMoney } from 'soresu-form/web/form/MoneyValidator'

import VaTraineeDayCalculator from './VaTraineeDayCalculator'
import { Field } from 'soresu-form/web/va/types'
import { ValidationError, Validator } from 'soresu-form/web/form/SyntaxValidator'

export default class VaSyntaxValidator implements Validator {
  static validateSyntax(field: Field, value: any): ValidationError | undefined {
    switch (field.fieldType) {
      case 'vaSelfFinancingField':
        return isValidMoney(value) ? undefined : { error: 'money' }
      case 'vaTraineeDayCalculator':
        return VaTraineeDayCalculator.validateTotal(field, value)
      default:
        return undefined
    }
  }
}
