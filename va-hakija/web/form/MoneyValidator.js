import FormUtil from 'va-common/web/form/FormUtil'

export default class MoneyValidator {
  static validateMoneyField(value, validationErrors) {
    const moneyError = MoneyValidator.validateMoney(value)
    if (moneyError) {
      validationErrors.push(moneyError)
    }
  }

  static validateMoney(input) {
    return /^[0-9]*$/.test(input) && FormUtil.isNumeric(input) ? undefined : { error: "money" }
  }
}