import MathUtil from '../MathUtil'

export default class DecimalValidator {
  static validateDecimal(input) {
    return MathUtil.representsInteger(input) || MathUtil.representsDecimal(input) ? undefined : { error: "decimal" }
  }
}
