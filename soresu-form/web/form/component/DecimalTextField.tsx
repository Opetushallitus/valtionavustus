import BasicTextField, { BasicTextFieldProps } from './BasicTextField'

interface DecimalTextFieldProps extends BasicTextFieldProps {}
export default class DecimalTextField extends BasicTextField<DecimalTextFieldProps> {
  baseClassName() {
    return 'soresu-decimal-field'
  }
}
