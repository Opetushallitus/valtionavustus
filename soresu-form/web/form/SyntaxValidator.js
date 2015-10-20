import _ from 'lodash'
import FormUtil from './FormUtil.js'
import BankAccountValidator from './BankAccountValidator.js'
import MoneyValidator from './MoneyValidator'

export default class SyntaxValidator {
  static validateSyntax(field, value) {
    var validationErrors = []
    if (field.required && (!value || _.trim(value).length < 1)) {
      validationErrors = [{error: "required"}]
    }

    if (!value) {
      return validationErrors
    }

    switch (field.fieldType) {
      case 'emailField':
      case 'vaEmailNotification':
        var emailError = SyntaxValidator.validateEmail(value)
        if (emailError) {
          validationErrors.push(emailError)
        }
        break;
      case 'moneyField':
        MoneyValidator.validateMoneyField(value, validationErrors);
        break;
      case 'finnishBusinessIdField':
        const finnishBusinessIdError = SyntaxValidator.validateBusinessId(value)
        if (finnishBusinessIdError) {
          validationErrors.push(finnishBusinessIdError)
        }
        break;
      case 'iban':
        const ibanError = SyntaxValidator.validateIban(value)
        if (ibanError) {
          validationErrors.push(ibanError)
        }
        break;
      case 'bic':
        const bicError = SyntaxValidator.validateBic(value)
        if (bicError) {
          validationErrors.push(bicError)
        }
        break;
    }

    return validationErrors
  }

  static validateEmail(input) {
    function lastPartIsLongerThanOne(email) {
      const parts = email.split('\.')
      return parts[parts.length -1].length > 1
    }
    // Pretty basic regexp, allows anything@anything.anything
    const validEmailRegexp = /\S+@\S+\.\S+/
    const invalidEmailRegexp = /.*%0[aA].*/
    const validEmail = validEmailRegexp.test(input) && lastPartIsLongerThanOne(input) && !invalidEmailRegexp.test(input)
    return validEmail ? undefined : { error: "email" }

  }

  static validateBusinessId(input) {
    // see: http://tarkistusmerkit.teppovuori.fi/tarkmerk.htm#y-tunnus2
    var hasValidForm = /^[0-9]{7}-[0-9]$/.test(input)
    if (!hasValidForm) {
      return {error: "finnishBusinessId"}
    }
    var checkDigit = parseInt(input[8])
    var multipliers = [7, 9, 10, 5, 8, 4, 2]
    var digits = []
    for (var i = 0; i < 7; i++) {
      digits.push(parseInt(input[i]))
    }
    var sum = 0
    for (var i = 0; i < 7; i++) {
      sum += multipliers[i] * digits[i]
    }
    var modulo = sum % 11
    var calculatedCheckDigit = 11 - modulo
    return calculatedCheckDigit == checkDigit ? undefined : { error: "finnishBusinessId" }
  }

  static validateIban(input) {
    return BankAccountValidator.isValidIban(input) ? undefined : { error: "iban" }
  }

  static validateBic(input) {
    return BankAccountValidator.isValidBic(input) ? undefined : { error: "bic" }
  }
}
