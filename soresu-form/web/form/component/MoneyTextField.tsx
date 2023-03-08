import BasicTextField from './BasicTextField'

export default class MoneyTextField extends BasicTextField<{}> {
  baseClassName() {
    return 'soresu-money-field'
  }
}
