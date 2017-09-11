import BasicTextField from './BasicTextField.jsx'

export default class IbanTextField extends BasicTextField {
  constructor(props) {
    super(props)
    this.inputType = "text"
  }
}