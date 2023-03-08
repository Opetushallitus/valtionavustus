import BasicTextField, { BasicTextFieldProps } from './BasicTextField'

interface EmailTextFieldProps extends BasicTextFieldProps {}
export default class EmailTextField extends BasicTextField<EmailTextFieldProps> {
  inputType: string
  constructor(props: EmailTextFieldProps) {
    super(props)
    this.inputType = 'email'
  }

  baseClassName() {
    return 'soresu-email-field'
  }
}
