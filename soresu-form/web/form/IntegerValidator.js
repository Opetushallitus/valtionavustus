import { representsInteger } from '../MathUtil'

export default class IntegerValidator {
  static validateInteger(input) {
    return /^[1-9][0-9]*$/.test(input) && representsInteger(input)
      ? undefined
      : { error: 'integer' }
  }
}
