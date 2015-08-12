import _ from 'lodash'
import FormUtil from './FormUtil.js'

export default class SyntaxValidator {
  static validateSyntax(field, value) {
    var validationErrors = []
    if (field.required && (!value || _.trim(value).length < 1)) {
      validationErrors = [{error: "required"}]
    }

    if (field.displayAs === 'emailField' && value) {
      var emailError = SyntaxValidator.validateEmail(value);
      if (emailError) {
        validationErrors.push(emailError)
      }
    }

    if (field.displayAs === 'moneyField' && value) {
      const moneyError = SyntaxValidator.validateMoney(value);
      if (moneyError) {
        validationErrors.push(moneyError)
      }
    }

    if (field.displayAs === 'businessIdField' && value) {
      const businessIdError = SyntaxValidator.validateBusinessId(value);
      if (businessIdError) {
        validationErrors.push(businessIdError)
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
    const validEmail = validEmailRegexp.test(input) && lastPartIsLongerThanOne(input)
    return validEmail ? undefined : {error: "email"}
  }

  static validateMoney(input) {
    return /^[0-9]*$/.test(input) && FormUtil.isNumeric(input) ? undefined : {error: "money"}
  }

  static validateBusinessId(input) {
    return true
  }
}
