import { isNumeric } from '../MathUtil'

export function isValidMoney(input: string): boolean {
  return isInteger(input) && hasMaxSevenDigits(parseInt(input, 10))
}

function isInteger(input: string): boolean {
  return /^[0-9]*$/.test(input) && isNumeric(input)
}

function hasMaxSevenDigits(input: number): boolean {
  return input <= 9999999
}
