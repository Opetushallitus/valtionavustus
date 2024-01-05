import { isNumeric } from '../MathUtil'
import { Field, FieldType } from 'soresu-form/web/va/types'

export function isValidMoney(input: string): boolean {
  return isInteger(input) && hasMaxSevenDigits(parseInt(input, 10))
}

function isInteger(input: string): boolean {
  return /^[0-9]*$/.test(input) && isNumeric(input)
}

function hasMaxSevenDigits(input: number): boolean {
  return input <= 9999999
}

const moneyFields: FieldType[] = ['moneyField', 'fixedMultiplierMoneyField'] as const

export function isMoneyField({ fieldType }: Field) {
  return moneyFields.includes(fieldType)
}
