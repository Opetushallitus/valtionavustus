import _ from 'lodash'
import Big, { BigSource } from 'big.js'

interface Fraction {
  nominator: number
  denominator: number
}

export function decimalShareRoundedUpOf(fraction: BigSource, total: BigSource): number {
  const multiplied = Big(fraction).times(total)

  // detect rounding error: is the value in `multiplied` coercable to an integer?
  const n1 = Number(multiplied)
  const n2 = parseInt(multiplied.toString(), 10)

  return n1 === n2 ? n1 : Number(multiplied.round(0, 3))
}

export function ratioShareRoundedUpOf(ratio: Fraction, total: BigSource) {
  return decimalShareRoundedUpOf(Big(ratio.nominator).div(ratio.denominator), total)
}

export function percentageShareRoundedUpOf(percentage: number, total: BigSource) {
  return decimalShareRoundedUpOf(Big(percentage).div(100), total)
}

export function percentageOf(part: number, total: number): number {
  return (part / total) * 100
}

export function isNumeric(n: any): boolean {
  const num = parseDecimal(n)
  return !isNaN(num) && isFinite(num)
}

export function roundDecimal(
  number: number,
  digits: number,
  roundingMode: 'round' | 'floor' | 'ceil' = 'round'
): number {
  return Number(Math[roundingMode](Number(number + 'e' + digits)) + 'e-' + digits)
}

export function parseDecimal(value: any): number {
  return _.isNumber(value) ? (value === 0 ? 0 : value) : parseFloat(normalizeDecimalStr('' + value))
}

export function formatDecimal(number: number | string, separator = ','): string {
  return ('' + number).replace('.', separator)
}

export function representsInteger(value: string): boolean {
  const asString = '' + value
  return parseInt(asString, 10).toString() === asString
}

export function representsDecimal(value: string): boolean {
  const normalized = normalizeDecimalStr('' + value)
  const dotZeroTrimmed = normalized.replace(/\.0+$/, '')
  return parseDecimal(normalized).toString() === dotZeroTrimmed
}

function normalizeDecimalStr(str: string): string {
  return str.replace(/,/g, '.')
}
