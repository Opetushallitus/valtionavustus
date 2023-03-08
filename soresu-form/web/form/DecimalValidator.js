import { representsInteger, representsDecimal } from '../MathUtil'

export default class DecimalValidator {
  static validateDecimal(input) {
    return representsInteger(input) || representsDecimal(input) ? undefined : { error: 'decimal' }
  }
}
