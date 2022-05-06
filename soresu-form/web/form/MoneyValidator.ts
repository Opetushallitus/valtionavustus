import { isNumeric } from "../MathUtil";

export function validateMoney(input: string) {
  return isValidMoney(input) ? undefined : { error: "money" };
}

export function isValidMoney(input: string): boolean {
  return isInteger(input);
}

function isInteger(input: string): boolean {
  return /^[0-9]*$/.test(input) && isNumeric(input);
}
