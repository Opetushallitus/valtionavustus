import _ from 'lodash'
import Big from 'big.js'

export default class MathUtil {
  static decimalShareRoundedUpOf(fraction, total) {
    const multiplied = Big(fraction).times(total)

    // detect rounding error: is the value in `multiplied` coercable to an integer?
    const n1 = Number(multiplied)
    const n2 = parseInt(multiplied, 10)

    return n1 === n2 ? n1 : Number(multiplied.round(0, 3))
  }

  static ratioShareRoundedUpOf(ratio, total) {
    return MathUtil.decimalShareRoundedUpOf(Big(ratio.nominator).div(ratio.denominator), total)
  }

  static percentageShareRoundedUpOf(percentage, total) {
    return MathUtil.decimalShareRoundedUpOf(Big(percentage).div(100), total)
  }

  static percentageOf(part, total) {
    return (part / total) * 100
  }

  static isNumeric(n) {
    const num = MathUtil.parseDecimal(n)
    return !isNaN(num) && isFinite(num)
  }

  static roundDecimal(number, digits, roundingMode = "round") {
    return Number(Math[roundingMode](Number(number + "e" + digits)) + "e-" + digits)
  }

  static parseDecimal(value) {
    return _.isNumber(value)
      ? (value === -0 ? 0 : value)
      : parseFloat(normalizeDecimalStr("" + value))
  }

  static formatDecimal(number, separator = ",") {
    return ("" + number).replace(".", separator)
  }

  static representsInteger(value) {
    const asString = "" + value
    return parseInt(asString, 10).toString() === asString
  }

  static representsDecimal(value) {
    const normalized = normalizeDecimalStr("" + value)
    const dotZeroTrimmed = normalized.replace(/\.0+$/, "")
    return MathUtil.parseDecimal(normalized).toString() === dotZeroTrimmed
  }
}

const normalizeDecimalStr = str =>
  str.replace(/,/g, ".")
