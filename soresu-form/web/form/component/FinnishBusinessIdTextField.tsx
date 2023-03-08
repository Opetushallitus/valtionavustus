import BasicTextField, { BasicTextFieldProps } from './BasicTextField'

interface FinnishBusinessIdTextFieldProps extends BasicTextFieldProps {}

export default class FinnishBusinessIdTextField extends BasicTextField<FinnishBusinessIdTextFieldProps> {
  inputType: string

  constructor(props: FinnishBusinessIdTextFieldProps) {
    super(props)
    this.inputType = 'text'
  }

  baseClassName() {
    return 'soresu-finnish-business-id-field'
  }
}
