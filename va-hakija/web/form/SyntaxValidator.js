import _ from 'lodash'
import FormUtil from 'va-common/web/form/FormUtil.js'
import BankAccountValidator from './BankAccountValidator.js'

export default class SyntaxValidator {
  static validateSyntax(field, value) {
    var validationErrors = []
    if (field.required && (!value || _.trim(value).length < 1)) {
      validationErrors = [{error: "required"}]
    }

    if (field.displayAs === 'emailField' && value) {
      var emailError = SyntaxValidator.validateEmail(value)
      if (emailError) {
        validationErrors.push(emailError)
      }
    }

    if (field.displayAs === 'moneyField' && value) {
      const moneyError = SyntaxValidator.validateMoney(value)
      if (moneyError) {
        validationErrors.push(moneyError)
      }
    }

    if (field.displayAs === 'finnishBusinessIdField' && value) {
      const finnishBusinessIdError = SyntaxValidator.validateBusinessId(value)
      if (finnishBusinessIdError) {
        validationErrors.push(finnishBusinessIdError)
      }
    }

    if (field.displayAs === 'iban' && value) {
      const ibanError = SyntaxValidator.validateIban(value)
      if (ibanError) {
        validationErrors.push(ibanError)
      }
    }

    if (field.displayAs === 'bic' && value) {
      const bicError = SyntaxValidator.validateBic(value)
      if (bicError) {
        validationErrors.push(bicError)
      }
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

  static validateMoney(input) {
    return /^[0-9]*$/.test(input) && FormUtil.isNumeric(input) ? undefined : { error: "money" }
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
