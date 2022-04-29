import { isNumeric } from "../MathUtil";

export default class MoneyValidator {
  static validateMoney(input) {
    return /^[0-9]*$/.test(input) && isNumeric(input)
      ? undefined
      : { error: "money" };
  }
}
