import _ from 'lodash'

import VaTraineeDayCalculator from './VaTraineeDayCalculator.jsx'

export default class VaSyntaxValidator {
  static validateSyntax(field, value) {
    var validationErrors = undefined

    switch (field.fieldType) {
      case 'vaTraineeDayCalculator':
        return VaTraineeDayCalculator.validateTotal(field, value)
        break;
    }

    return validationErrors
  }
}
