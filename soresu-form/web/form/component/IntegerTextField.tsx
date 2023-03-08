import BasicTextField, { BasicTextFieldProps } from './BasicTextField'

interface IntegerTextFieldProps extends BasicTextFieldProps {}

export default class IntegerTextField extends BasicTextField<IntegerTextFieldProps> {
  baseClassName() {
    return 'soresu-integer-field'
  }
}
