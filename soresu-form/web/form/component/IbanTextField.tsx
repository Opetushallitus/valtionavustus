import BasicTextField, { BasicTextFieldProps } from './BasicTextField'

interface IbanTextFieldProps extends BasicTextFieldProps {}

export default class IbanTextField extends BasicTextField<IbanTextFieldProps> {
  inputType: string

  constructor(props: IbanTextFieldProps) {
    super(props)
    this.inputType = 'text'
  }
}
