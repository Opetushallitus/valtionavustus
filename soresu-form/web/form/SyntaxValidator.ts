import _ from 'lodash'

import BankAccountValidator from './BankAccountValidator'
import { validateMoney } from './MoneyValidator'
import IntegerValidator from './IntegerValidator'
import DecimalValidator from './DecimalValidator'
import TableValidator from './TableValidator'
import { Field } from '../va/types'

export type ValidationError = { error: string }
export abstract class Validator {
  static validateSyntax: (field: Field, value: any) => ValidationError | undefined
}

function isFalsyOrEmptyStringButNotZeroMoney(value: any, field: Field): boolean {
  if (field.fieldType === 'moneyField') return isFalsyButNotZero(value)

  return !value || _.trim(value).length < 1
}

function isFalsyButNotZero(value: any): boolean {
  if (value === 0) return false

  return !value
}

export default class SyntaxValidator {
  static validateSyntax(field: Field, value: any, customFieldSyntaxValidator?: typeof Validator) {
    let validationErrors: ValidationError[] = []

    if (field.required && isFalsyOrEmptyStringButNotZeroMoney(value, field)) {
      validationErrors = [{ error: 'required' }]
    }

    if (isFalsyButNotZero(value)) {
      return validationErrors
    }

    switch (field.fieldType) {
      case 'emailField':
      case 'vaEmailNotification':
        {
          const emailError = SyntaxValidator.validateEmail(value)
          if (emailError) {
            validationErrors.push(emailError)
          }
        }
        break
      case 'moneyField':
        {
          const moneyError = validateMoney(value)
          if (moneyError) {
            validationErrors.push(moneyError)
          }
        }
        break
      case 'integerField':
        {
          const integerError = IntegerValidator.validateInteger(value)
          if (integerError) {
            validationErrors.push(integerError)
          }
        }
        break
      case 'decimalField':
        {
          const decimalError = DecimalValidator.validateDecimal(value)
          if (decimalError) {
            validationErrors.push(decimalError)
          }
        }
        break
      case 'finnishBusinessIdField':
        {
          const finnishBusinessIdError = SyntaxValidator.validateBusinessId(value)
          if (finnishBusinessIdError) {
            validationErrors.push(finnishBusinessIdError)
          }
        }
        break
      case 'iban':
        {
          const ibanError = SyntaxValidator.validateIban(value)
          if (ibanError) {
            validationErrors.push(ibanError)
          }
        }
        break
      case 'bic':
        {
          const bicError = SyntaxValidator.validateBic(value)
          if (bicError) {
            validationErrors.push(bicError)
          }
        }
        break
      case 'tableField':
        _.forEach(TableValidator.validateTable(field, value), (err) => {
          validationErrors.push(err)
        })
        break
      default:
        if (customFieldSyntaxValidator) {
          const customError = customFieldSyntaxValidator.validateSyntax(field, value)
          if (customError) {
            validationErrors.push(customError)
          }
        }
    }

    return validationErrors
  }

  static validateEmail(input: any) {
    const validEmailRegexp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
    const invalidEmailRegexp = /[^\x00-\x7F]|%0[aA]/ // eslint-disable-line no-control-regex
    const isEmailValid =
      _.isString(input) &&
      input.length <= 254 &&
      validEmailRegexp.test(input) &&
      !invalidEmailRegexp.test(input)
    return isEmailValid ? undefined : { error: 'email' }
  }

  static validateUrl(input: any) {
    // http(s)://xx.xx(.xx)*/any valid url characters
    const validUrlRegexp =
      /^https?:\/\/[\da-z-]{2,63}(\.[\da-z-]{2,63})+(\/[a-z|0-9|\-._~:/?#[\]@!$&'()*+,;=%]*)?$/i
    const validUrl = validUrlRegexp.test(input)
    return validUrl ? undefined : { error: 'url' }
  }

  static validateBusinessId(input: any) {
    // see: http://tarkistusmerkit.teppovuori.fi/tarkmerk.htm#y-tunnus2
    const hasValidForm = /^[0-9]{7}-[0-9]$/.test(input)
    if (!hasValidForm) {
      return { error: 'finnishBusinessId' }
    }
    const checkDigit = parseInt(input[8], 10)
    const multipliers = [7, 9, 10, 5, 8, 4, 2]
    const digits = []
    for (let i = 0; i < 7; i++) {
      digits.push(parseInt(input[i], 10))
    }
    let sum = 0
    for (let i = 0; i < 7; i++) {
      sum += multipliers[i] * digits[i]
    }
    const modulo = sum % 11
    const calculatedCheckDigit = modulo === 0 ? 0 : 11 - modulo
    return calculatedCheckDigit === checkDigit ? undefined : { error: 'finnishBusinessId' }
  }

  static validateIban(input: any) {
    return BankAccountValidator.isValidIban(input) ? undefined : { error: 'iban' }
  }

  static validateBic(input: any) {
    return BankAccountValidator.isValidBic(input) ? undefined : { error: 'bic' }
  }
}
