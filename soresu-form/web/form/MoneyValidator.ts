import { isNumeric } from "../MathUtil";

export function validateMoney(input: string) {
  return /^[0-9]*$/.test(input) && isNumeric(input)
    ? undefined
    : {error: "money"};
}

export default class MoneyValidator {
  static validateMoney(input: string) {
    return validateMoney(input);
  }
}
