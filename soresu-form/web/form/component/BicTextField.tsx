import BasicTextField, { BasicTextFieldProps } from './BasicTextField'

interface BicTextFieldProps extends BasicTextFieldProps {}

export default class BicTextField extends BasicTextField<BicTextFieldProps> {
  inputType: string

  constructor(props: BicTextFieldProps) {
    super(props)
    this.inputType = 'text'
  }
}
