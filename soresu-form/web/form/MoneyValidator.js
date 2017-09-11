import MathUtil from '../MathUtil'

export default class MoneyValidator {
  static validateMoney(input) {
    return /^[0-9]*$/.test(input) && MathUtil.isNumeric(input) ? undefined : { error: "money" }
  }
}
