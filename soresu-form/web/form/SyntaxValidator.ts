import _ from 'lodash'

import BankAccountValidator from './BankAccountValidator'
import { isMoneyField, isValidMoney } from './MoneyValidator'
import TableValidator from './TableValidator'
import { Field } from '../va/types'
import { representsInteger, representsDecimal } from '../MathUtil'

export type ValidationError = { error: string }
export abstract class Validator {
  static validateSyntax: (field: Field, value: any) => ValidationError | undefined
}

function isFalsyOrEmptyStringButNotZeroMoney(value: any, field: Field): boolean {
  if (isMoneyField(field)) {
    return isFalsyButNotZero(value)
  }

  return !value || _.trim(value).length < 1
}

function isFalsyButNotZero(value: any): boolean {
  if (value === 0) return false

  return !value
}

function isValidInteger(input: any) {
  return /^[1-9][0-9]*$/.test(input) && representsInteger(input)
}

function isValidDecimal(input: any) {
  return representsInteger(input) || representsDecimal(input)
}

export function isValidEmail(input: any): boolean {
  const validEmailRegexp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
  const invalidEmailRegexp = /[^\x00-\x7F]|%0[aA]/ // eslint-disable-line no-control-regex
  const isEmailValid =
    _.isString(input) &&
    input.length <= 254 &&
    validEmailRegexp.test(input) &&
    !invalidEmailRegexp.test(input)
  return isEmailValid
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
          const emailError = !isValidEmail(value)
          if (emailError) {
            validationErrors.push({ error: 'email' })
          }
        }
        break
      case 'moneyField':
        {
          const moneyError = !isValidMoney(value)
          if (moneyError) {
            validationErrors.push({ error: 'money' })
          }
        }
        break
      case 'integerField':
        {
          const integerError = !isValidInteger(value)
          if (integerError) {
            validationErrors.push({ error: 'integer' })
          }
        }
        break
      case 'decimalField':
        {
          const decimalError = !isValidDecimal(value)
          if (decimalError) {
            validationErrors.push({ error: 'decimal' })
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
          const ibanError = !BankAccountValidator.isValidIban(value)
          if (ibanError) {
            validationErrors.push({ error: 'iban' })
          }
        }
        break
      case 'bic':
        {
          const bicError = !BankAccountValidator.isValidBic(value)
          if (bicError) {
            validationErrors.push({ error: 'bic' })
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
}
